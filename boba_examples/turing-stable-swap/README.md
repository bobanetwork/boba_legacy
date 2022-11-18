# Turing - Stable Swap

## What is this example about?
This example shows how to use `turingHelper.TuringTx()` to perform a stable swap.

You will need to deploy the `turing_stableSwap.py` on a server such as AWS lambda, since we need to do off-chain calculations.

## How does it work?
Using Turing to access APIs from within your solidity smart contract

You can use Turing as a pipe to any other computer, such as APIs for social networks, weather and location data, or market data. Please keep in mind however that Turing differs sharply from established providers of market trading data, in particular, since **Turing does not provide a decentralized mechanism to verify the accuracy of the data**. **You should therefore not use Turing for production trading or lending use, but should use proven, decentralized data oracles**.

**Data/Oracle best practices** Regardless of your specific use case, minimally, you will need to secure your pipe/contract against data outliers, temporary lack of data, and malicious attempts to distort the data. For example, you could average over multiple on-chain oracles and/or off-chain sources - in this case, the role of Turing could be to 'augment' or separately estimate the reliability and timeliness of on-chain oracles.

**Note - Boba does not provide endpoints for you** You are responsible for setting up an endpoint that Turing can access - read on for more information and example code. Assume you have an API access key to a provider of weather data. First, set up a server or endpoint that queries this API, and stores and analyzes the data, if needed. Your own server/endpoint contains your secrets and API access keys. Next, add a simple interface to allow Turing to interact with your server. Turing calls to your server  contain the address of the calling contract and there are multiple ways to control access to your server in very granular manner, if desired. See `.packages/boba/turing/AWS_code/turing_oracle.py` for a copy-paste example for querying data APIs via a wrapper at AWS Lambda:

```python
/AWS_code/turing_oracle.py

# Note - This code is running on YOUR server

...
  api_key = 'YOUR_API_KEY' # Insert your API key here

  authorized_contract = None # for open access
  # or...
  authorized_contract = '0xOF_YOUR_HELPER_CONTRACT' # to restrict access to only your smart contract
...

```

You should lock down your off-chain endpoint to only accept queries from your smart contract. To do this, designate your smart contract's address on Boba as the `authorized_contract`. If you wish to allow open access, set this variable to `None`. You can then call this API in your smart contract:

```javascript

  urlStr = 'https://_myAPIURL_/social'
  likes = social.getCurrentLikes(tweetUniqueID)

    // Test/Debug response
    Tweet 123456789 had: 18 likes by time: 1650534735

```

## AWS and Google Cloud Function Examples

Your external API will need to accept calls from the L2Geth and return data in a way that can be understood by the L2Geth. Examples are provided in `./packages/boba/turing/AWS_code`. Specific instructions for setting up AWS lambda endpoints are [here](./AWS_code/AWS_lambda_setup.md) - note that _all_ APIs can be used, not just AWS Lambda endpoints.

## Important Properties of Turing

* Strings returned from external endpoints are limited to 322 characters (`5*64+2=322`)
* Only one Turing call per execution
* There is **1200 ms timeout** on API responses. Please make sure that your API responds promptly. If you are using AWS, note that some of their services take several seconds to spin up from a 'coldstart', resulting in persistent failure of your first call to your endpoint.

### String length limit

The string length cap of 322 is large enough to return, for example, four `uint256` from the external api:

```javascript
//example: returing 4 unit264

  // 0x
  // 0000000000000000000000000000000000000000000000000000000000000080 ** length of the dynamic bytes
  // 0000000000000000000000000000000000000000000000000000000000418b95 ** first uint256
  // 0000000000000000000000000000000000000000000000000000017e60d3b45f **
  // 0000000000000000000000000000000000000000000000000000000000eb7ca3 **
  // 00000000000000000000000000000000000000000000000000000000004c788f ** fourth unit265

```

You can return anything you want - e.g. numbers, strings, ... - and this information will then later be decoded per your `abi.decode`. For example, if the external API sends two `unit256`:

```javascript

  // Payload from the external API
  // 0x
  // 0000000000000000000000000000000000000000000000000000000000000040 ** length of the dynamic bytes
  // 0000000000000000000000000000000000000000000000000000000000418b95 ** first uint256
  // 0000000000000000000000000000000000000000000000000000017e60d3b45f ** second uint256

  // decoding of those data within the smart contract
  (uint256 market_price, uint256 time) = abi.decode(encResponse,(uint256,uint256));

```

### One Turing call per Transaction

At present, you can only have one Turing call per transaction, i.e. a Turing call cannot call other contracts that invoke Turing as well. Transactions that result in multiple Turing calls in the call stack will revert.

## Turing Architecture

The modified Turing L2Geth, `L2TGeth`, monitors calldata for particular Keccak methodIDs of functions such as `GetRandom(uint32 rType, uint256 _random)` and `GetResponse(uint32 rType, string memory _url, bytes memory _payload)`. Upon finding such methodIDs in the execution flow, at any level, L2TGeth parses the calldata for additional information, such as external URLs, and uses that information to either directly prepare a response (e.g. generate a random number) or to call an external API. After new information is generated (or has returned from the external API), L2TGeth then runs the function with updated inputs, such that the new information flows back to the caller (via overloaded variables and a system for conditionally bypassing `requires`). Put simply, L2TGeth intercepts function calls, adds new information to the inputs, and then runs the function with the updated inputs.

In general, this system would lead to disagreement about the correct state of the underlying blockchain. For example, if replicas and verifiers simply ingested the transactions and re-executed them, then every blockchain would differ, destroying the entire system. Thus, a new data field called `Turing` (aka `turing`, `l1Turing` or `L1Turing` depending on context) has been added to the L2Geth `transactions`,`messages`, `receipts`, `blocks`, `evm.contexts`, and various `codecs` and `encoders/decoders`. This new data field is understood by `core-utils` as well as the `data-translation-layer` and the `batch-submitter`, and allows Turing data to be pushed into, and recovered from, the `CanonicalTransactionChain` (CTC). This extra information allows all verifiers and replicas to enter a new **replay** mode, where instead of generating new random numbers (or calling off-chain for new data), they use the Turing data stored in the CTC (or in the L2 blocks as part of the transaction metadata) to generate a faithful copy of the main Boba L2 blockchain. Thus, the overall system works as before, with all the information needed for restoring the Boba L2 and, just as critically, for public fraud detection, being publicly deposited into Ethereum.

## Quickstart for Turing Developers

Open a terminal window and from the top level:

```bash
$ yarn
$ yarn build
$ cd ops
$ BUILD=1 DAEMON=0 ./up_local.sh
```

This will spin up the stack. Then, open a second terminal window and:

```bash
$ cd packages/boba/turing
$ yarn test:local
```

**Note: Testing on Goerli**

To test on Goerli, you need a private key with both ETH and BOBA on the Boba L2; the private key needs to be provided in `hardhat.config.js`. Just replace all the zeros with your key:

```javascript
    boba_goerli: {
      url: 'https://goerli.boba.network',
      accounts: ['0x0000000000000000000000000000000000000000000000000000000000000000']
    },
```

Then, run:

```bash
$ cd packages/boba/turing
$ yarn test:goerli
```

The tests will perform some basic floating point math, provide some random numbers, and get the latest BTC-USD exchange rate:

```bash
yarn run v1.22.15
$ hardhat --network boba_local test

  Stableswap at AWS Lambda
    URL set to https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/swapy
    Helper contract deployed as 0x8e264821AFa98DD104eEcfcfa7FD9f8D8B320adA
    Stableswap contract deployed as 0x871ACbEabBaf8Bed65c22ba7132beCFaBf8c27B5
    addingPermittedCaller to TuringHelper 0x000000000000000000000000871acbeabbaf8bed65c22ba7132becfabf8c27b5
    Test contract whitelisted in TuringHelper (1 = yes)? 1
    ✓ contract should be whitelisted (50ms)
    Credit Prebalance 0
    BOBA Balance in your account 300000000000000000000
    ✓ Should register and fund your Turing helper contract in turingCredit (172ms)
    ✓ should return the helper address (116ms)
      result of x_in 12 -> y_out = 50
    ✓ should correctly swap X in for Y out (202ms)

  Turing 256 Bit Random Number
    Helper contract deployed at 0xb185E9f6531BA9877741022C92CE858cDCc5760E
    Test contract deployed at 0xAe120F0df055428E45b264E7794A18c54a2a3fAF
    addingPermittedCaller to TuringHelper 0x000000000000000000000000ae120f0df055428e45b264e7794a18c54a2a3faf
    Test contract whitelisted in TuringHelper (1 = yes)? 1
    ✓ contract should be whitelisted (51ms)
    Credit Prebalance 0
    BOBA Balance in your account 290000000000000000000
    ✓ Should register and fund your Turing helper contract in turingCredit (174ms)
    Turing 42 = 42
    ✓ should get the number 42 (91ms)
    Turing VRF 256 = 11642062518220346831211086370276871135010213271872466428492348202384902597141n
    ✓ should get a 256 bit random number (83ms)
    Turing VRF 256 = 39492154036951735205025381980653780356965271743173916331971607322325246415525n
    ✓ should get a 256 bit random number (83ms)

  Pull Bitcoin - USD quote
    URL set to https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/quote
    Helper contract deployed as 0x7C8BaafA542c57fF9B2B90612bf8aB9E86e22C09
    Lending contract deployed as 0x0a17FabeA4633ce714F1Fa4a2dcA62C3bAc4758d
    addingPermittedCaller to TuringHelper 0x0000000000000000000000000a17fabea4633ce714f1fa4a2dca62c3bac4758d
    Test contract whitelisted in TuringHelper (1 = yes)? 1
    ✓ contract should be whitelisted (53ms)
    ✓ should return the helper address
    Credit Prebalance 0
    BOBA Balance in your account 280000000000000000000
    ✓ Should register and fund your Turing helper contract in turingCredit (176ms)
    Bitcoin to USD price is 36654.89
    timestamp 1643158948154
    ✓ should get the current Bitcoin - USD price (305ms)

  Turing NFT Random 256
    Turing Helper contract deployed at 0xd9fEc8238711935D6c8d79Bef2B9546ef23FC046
    ERC721 contract deployed at 0xd3FFD73C53F139cEBB80b6A524bE280955b3f4db
    adding your ERC721 as PermittedCaller to TuringHelper 0x000000000000000000000000d3ffd73c53f139cebb80b6a524be280955b3f4db
    Credit Prebalance 0
    BOBA Balance in your account 270000000000000000000
    ✓ Should register and fund your Turing helper contract in turingCredit (122ms)
    ERC721 contract whitelisted in TuringHelper (1 = yes)? 1
    ✓ Your ERC721 contract should be whitelisted
    256 bit random number as a BigInt = 61245594159531997717158776666900035572992757857563713350570408643552830626492n
    Minted an NFT with Attribute A = 135 and Attribute B = 103
    Minted a pirate with a green hat
    ✓ should mint an NFT with random attributes (65ms)


  22 passing (3s)

✨  Done in 6.67s.
```
