---
description: Turing Example - CAPTCHA-based token faucet
---

Boba Faucet is a system for distributing Rinkeby ETH and Rinkeby BOBA. It's implemented using Turing hybrid compute. Before claiming tokens, users answer a CAPTCHA. Their answer is hashed and compared off-chain to the correct answer via Turing. Once their answer is verified, the smart contract releases the funds.

## Directory Structure

* `boba_community/turing-captcha-faucet/packages`: Contains all the typescript packages and contracts
  * `contracts`: Smart contracts implementing the Boba Faucet
  * `gateway`: The Boba Web faucet frontend
  * `deployment`: Boba faucet Rinkeby contract addresses
  * `api`: Boba faucet backend API

## Specification

The token-claiming process takes place in five steps:

### 1. User obtains the CAPTCHA image and the image UUID

The API GET request is sent to `https://api-turing.boba.network/get.catcha` on the frontend. The returned payload is 

   ```js
   {
     "UUID": "BYTES32",
     "imageBase64": "CAPTCHA IMAGE"
   }
   ```

The UUID and hashed CAPTCHA answer are stored in AWS Redis.

### 2. User sends a transaction to the `Boba Faucet` contract with the UUID and CAPTCHA answer

   ```javascript
   const BobaFaucet = new ethers.Contract(
     BOBA_FAUCET_CONTRACE_ADDRESS,
     BobaFaucetJson.abi,
     this.provider.getSigner()
   )
   const tx = await BobaFaucet.getBobaFaucet(uuid, answer)
   await tx.wait()
   ```

The answer is hashed in the `Boba Faucet` contract first before sending it to backend API.

```javascript
    bytes32 hashedKey = keccak256(abi.encodePacked(_key));
    bytes memory encRequest = abi.encodePacked(_uuid, hashedKey);
    bytes memory encResponse = turing.TuringTx(turingUrl, encRequest);
```

### 3. Geth sends a request to the backend and retrieves the result

The POST request with the hashed answer is sent to `https://api-turing.boba.network/verify.captcha`. It decodes the input and verifies the UUID with the hashed answer.

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

### 4. Geth atomically revises the calldata

On the contract level, we decode the result from the Turing request and release the funds if the answer is correct.

```javascript
    

    // Decode the response from outside API
    bytes memory encResponse = turing.TuringTx(turingUrl, encRequest);
    uint256 result = abi.decode(encResponse,(uint256));
    // Release the funds if it is correct
    require(result == 1, 'Captcha wrong');
    IERC20(BobaAddress).safeTransfer(msg.sender, BobaFaucetAmount);
```

### 5. User obtains the funds if the answer is correct or sees an error message

<img width="873" alt="image" src="https://user-images.githubusercontent.com/46272347/153475813-f4ffd103-3b95-4df7-a951-a321b84ff34a.png">

## Implementation

### Step 1: Creating API endpoints

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

### Step 2: Creating the Boba Faucet Contract

# BOBA Faucet Smart Contracts

## Deployment

Create a `.env` file in the root directory of the contracts folder. Add environment-specific variables on new lines in the form of `NAME=VALUE`. Examples are given in the `.env.example` file. Just pick which net you want to work on and copy either the "Rinkeby" _or_ the "Local" envs to your `.env`.

```bash

NETWORK=rinkeby
L1_NODE_WEB3_URL=https://rinkeby.infura.io/v3/9844f35ff4a84003a7025a65a9412002
L2_NODE_WEB3_URL=https://rinkeby.boba.network
ADDRESS_MANAGER_ADDRESS=0x93A96D6A5beb1F661cf052722A1424CDDA3e9418
DEPLOYER_PRIVATE_KEY=

```

Build and deploy all the needed contracts:

```bash

$ yarn build
$ yarn deploy

```

The smart contract imports the [Turing Helper Contract](../../packages/boba/turing/contracts/TuringHelper.sol) so it can interact with outside API endpoints.

```javascript
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
        require(result == 1, 'Captcha wrong');

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

### Step 3: Funding Turing Helper Contract

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

