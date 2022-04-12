# Boba Faucet

- [Overview](#Overview)
- [Directory Structure](#Directory-Structure)
- [Specification](#Specification)
- [Impementation](#Implementaion)
  * [Step 1: Creating API endpoints](#Step1--Creating-API-endpoints)
  * [Step2: Creating Boba Faucet Contract](#Step2--Creating-Boba-Faucet-Contract)
  * [Step3: Funding Turing Helper Contract](#Step3--Funding-Turing-Helper-Contract)

## Overview

Boba Faucet is a system for getting Boba Rinkeby ETH and Boba Rinkeby Boba Token. It's implemented using the Turing. Turing is a system for interacting with the outside world from within solidity smart contracts.

Before claiming the token, users have to answer the CAPTCHA. The answer is hashed and compared off-chain via Turing. Once the answer is verified, the smart contract releases the funds.

## Directory Structure

* [`packages`](./packages): Contains all the typescript packages and contracts
  * [`contracts`](./packages/contracts): Solidity smart contracts implementing the Boba Faucet
  * [`gateway`](./packages/gate): The Boba Web faucet
  * [`deployment`](./packages/deployment): Boba faucet contract addresses
  * [`api`](./packages/api): Boba faucet backend API

## Specification

This procedure takes place in five steps:

1. User gets the CAPTCHA image and UUID of the image

   The API GET request is sent to `https://api-turing.boba.network/get.catcha` on the frontend. The returned payload is 

   ```js
   {
     "UUID": "BYTES32",
     "imageBase64": "CAPTCHA IMAGE"
   }
   ```

   > The UUID and hashed CAPTCHA answer are stored in the AWS Redis.

2. User sends the transaction to the `Boba Faucet` contract with UUID and CAPTCHA answer

   ```javascript
   const BobaFaucet = new ethers.Contract(
     BOBA_FAUCET_CONTRACE_ADDRESS,
     BobaFaucetJson.abi,
     this.provider.getSigner()
   )
   const tx = await BobaFaucet.getBobaFaucet(uuid, answer)
   await tx.wait()
   ```

3. Geth sends the request to the backend and retrieves the result

   >  The answer is hashed in the `Boba Faucet` contract first before sending it to backend API.
   >
   > ```
   > bytes32 hashedKey = keccak256(abi.encodePacked(_key));
   > bytes memory encRequest = abi.encodePacked(_uuid, hashedKey);
   > bytes memory encResponse = turing.TuringTx(turingUrl, encRequest);
   > ```

   The POST request is sent to `https://api-turing.boba.network/verify.captcha` . It decodes the input and verifies the UUID with the hashed answer.

   ```python
   paramsHexString = body['params'][0]
   # Select uuid and answer
   # paramsHexString[0: 66] is the length of input data
   uuid = '0x' + paramsHexString[66: 130]
   answer = '0x' + paramsHexString[130:]
   # Get answer from Redis
   keyInRedis = db.get(uuid)
   # Return the payload
   return returnPayload(keyInRedis.decode('utf-8') == key)
   
   # Payload is built based on the result
   def returnPayload(result):
       # We return 0 or 1 using uint256
       payload = '0x' + '{0:0{1}x}'.format(int(32), 64)
       if result:
           # Add UINT256 1 if the result is correct
           payload += '{0:0{1}x}'.format(int(1), 64)
       else:
           # Add UINT256 0 if the result is wrong
           payload += '{0:0{1}x}'.format(int(0), 64)
   
       returnPayload = {
           'statusCode': 200,
           'body': json.dumps({ 'result': payload })
       }
   
       return returnPayload
   ```

4. Geth atomically revises the calldata

   On the contract level, we only need to decode the result from the Turing request and release the funds if the answer is correct.

   ```solidity
   // Decode the response from outside API
   bytes memory encResponse = turing.TuringTx(turingUrl, encRequest);
   uint256 result = abi.decode(encResponse,(uint256));
   // Release the funds if it is correct
   require(result == 1, 'Invalid key and UUID');
   IERC20(BobaAddress).safeTransfer(msg.sender, BobaFaucetAmount);
   ```

5. User gets the funds if the answer is correct or the error message
   <img width="873" alt="image" src="https://user-images.githubusercontent.com/46272347/153475813-f4ffd103-3b95-4df7-a951-a321b84ff34a.png">

## Implementation

### Step1: Creating API endpoints

Two simple API endpoints are created.

#### get.captcha

```python
image = ImageCaptcha(width=280, height=90)

# For image
uuid1 = uuid.uuid4()
imageStr = str(uuid1).split('-')[0]
imageStrBytes = Web3.solidityKeccak(['string'], [str(imageStr)]).hex()

# For key
uuid2 = uuid.uuid4()
keyBytes = Web3.solidityKeccak(['string'], [str(uuid2)]).hex()

# Use the first random string
imageData = image.generate(imageStr)

# Get base64
imageBase64 = base64.b64encode(imageData.getvalue())

# Read YML
with open("env.yml", 'r') as ymlfile:
config = yaml.load(ymlfile)

# Connect to Redis Elasticache
db = redis.StrictRedis(host=config.get('REDIS_URL'),
port=config.get('REDIS_PORT'))

# Store and set the expire time as 10 minutes
print('keyBytes: ', keyBytes, 'imageStrBytes: ', imageStrBytes, 'imageStr: ', imageStr)
db.set(keyBytes, imageStrBytes, ex=600)

payload = {'uuid': keyBytes, 'imageBase64': imageBase64.decode('utf-8') }
```

#### verify.captcha

```python
paramsHexString = body['params'][0]

uuid = '0x' + paramsHexString[66: 130]
key = '0x' + paramsHexString[130:]

# Read YML
with open("env.yml", 'r') as ymlfile:
  config = yaml.load(ymlfile)

  # Connect to Redis Elasticache
  db = redis.StrictRedis(host=config.get('REDIS_URL'),
                         port=config.get('REDIS_PORT'))

  # Store and set the expire time as 10 minutes
  keyInRedis = db.get(uuid)

  if keyInRedis:
    print('keyInRedis: ', keyInRedis.decode('utf-8'), 'key: ', key)
    return returnPayload(keyInRedis.decode('utf-8') == key)
  else:
    return returnPayload(False)
```

### Step2: Creating Boba Faucet Contract

The smart contract imports [Turing Helper Contract](https://github.com/omgnetwork/optimism-v2/blob/develop/packages/boba/turing/contracts/TuringHelper.sol), so it can interact with outside API endpoints.

```solidity
import './TuringHelper.sol';

contract BobaFaucet is Ownable {
    // Turing
    address public turingHelperAddress;
    string public turingUrl;
    TuringHelper public turing;
    
    constructor(
        address _turingHelperAddress,
        string memory _turingUrl
    ) {
        turingHelperAddress = _turingHelperAddress;
        turing = TuringHelper(_turingHelperAddress);
        turingUrl = _turingUrl;
    }
    
    function getBobaFaucet(
        bytes32 _uuid,
        string memory _key
    ) external {
        require(BobaClaimRecords[msg.sender] + waitingPeriod < block.timestamp, 'Invalid request');
				
        // The key is hashed
        bytes32 hashedKey = keccak256(abi.encodePacked(_key));
        uint256 result = _verifyKey(_uuid, hashedKey);

        require(result == 1, 'Invalid key and UUID');

        BobaClaimRecords[msg.sender] = block.timestamp;
        IERC20(BobaAddress).safeTransfer(msg.sender, BobaFaucetAmount);

        emit GetBobaFaucet(_uuid, hashedKey, msg.sender, BobaFaucetAmount, block.timestamp);
    }
    
    // Call Turing contract to get the result from the outside API endpoint
    function _verifyKey(bytes32 _uuid, bytes32 _key) private returns (uint256) {
        bytes memory encRequest = abi.encodePacked(_uuid, _key);
        bytes memory encResponse = turing.TuringTx(turingUrl, encRequest);

        uint256 result = abi.decode(encResponse,(uint256));

        emit VerifyKey(turingUrl, _uuid, _key, result);

        return result;
    }
}
```

### Step3: Funding Turing Helper Contract

We charge 0.01 BOBA for each Turing request and it's based on the Turing Helper Contract.

```js
// Deploy Turing Helper Contract
const Factory__TuringHelperr = new ContractFactory(
  TuringHelperJson.abi,
  TuringHelperJson.bytecode,
  (hre as any).deployConfig.deployer_l2
)

const TuringHelper = await Factory__TuringHelperr.deploy()
await TuringHelper.deployTransaction.wait()

console.log(`TuringHelper was deployed at: ${TuringHelper.address}`)

// Approve Boba Token to add funds to Turing Credit Contract
const BobaTuringCredit = new Contract(
  (hre as any).deployConfig.BobaTuringCreditAddress,
  BobaTuringCreditJson.abi,
  (hre as any).deployConfig.deployer_l2
)
const approveTx = await L2BobaToken.approve(
  BobaTuringCredit.address,
  utils.parseEther('100')
)
await approveTx.wait()

const addCreditTx = await BobaTuringCredit.addBalanceTo(
  utils.parseEther('100'),
  TuringHelper.address
)
await addCreditTx.wait()

// Add permission for Boba Faucet contract
const addPermissionTx = await TuringHelper.addPermittedCaller(
  BobaFaucet.address
)
await addPermissionTx.wait()
```

