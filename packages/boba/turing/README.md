# Basic Architecture of Turing and L2TGeth

- [Basic Architecture of Turing and L2TGeth](#basic-architecture-of-turing-and-l2tgeth)
  * [TLDR](#tldr)
    + [Turing status as of January 12 2022 - Release countdown](#turing-status-as-of-january-12-2022---release-countdown)
    + [Feature Preview: Using Turing to access real-time trading data from within your solidity smart contract](#feature-preview--using-turing-to-access-real-time-trading-data-from-within-your-solidity-smart-contract)
  * [Detailed Technical Background and Implementation](#detailed-technical-background-and-implementation)
    + [Quickstart for Turing Developers](#quickstart-for-turing-developers)
    + [Implementation: Step 1](#implementation--step-1)
    + [Step 2](#step-2)
    + [Step 3 - Batch Submitter Data Mangling](#step-3---batch-submitter-data-mangling)
    + [Step 4 - Writing to the CTC](#step-4---writing-to-the-ctc)
    + [Step 5 - Reading from the CTC](#step-5---reading-from-the-ctc)
    + [Step 6 - Verifier data ingestion](#step-6---verifier-data-ingestion)

## TLDR

Turing is a system for interacting with the outside world from within solidity smart contracts. All data returned from external APIs, such as random numbers and real-time financial data, are deposited into a public data-storage contract on Ethereum Mainnet. This extra data allows replicas, verifiers, and fraud-detectors to reproduce and validate the Boba L2 blockchain, block by block. 

**The information given in this technical deep-dive is not needed to use Turing.** Using Turing is as easy as calling specific predesignated functions from inside your smart contract. For example, to obtain a random number for minting NFTs, call:

```javascript

uint256 random_number = turing.getRandom()

```

To obtain the latest BTC-USD exchange rate, call:

```javascript

urlStr = 'https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/quote'
rate = lending.getCurrentQuote(urlStr, "BTC/USD")

```

### Turing status as of January 12 2022 - Release countdown

With this release, we have a working version of Turing and the associated modified `core-utils`, `batch-submitter`, and `data-translation-layer`. The next steps are to fix two security vulnerabilities and perform load- and stack-compatibility testing. We are targeting a release time of January 31, 00:00 UTC for Turing across our stack (Rinkeby and Mainnet). **Note - Turing is not yet available on the public chains (Rinkeby and Mainnet).**

ToDo:

* Upgrade the random number generator (currently `math/rand`) to something better such as `crypto/rand`
* Secure the L2TGeth against malicious inputs from off-chain
* Improve the data-packing system used to append turing payloads to the rawTransaction data sent to the L1
* Fix Geth Tests
* Add Integration tests to the GitHub actions

### Feature Preview: Using Turing to access real-time trading data from within your solidity smart contract

**Note - Boba does not provide trading data (except for deliberately delayed data for test and debugging purposes). To obtain real-time trading data, YOU will need to subscribe to any one of dozens of well-known trading data sources and obtain an api key from them. Real time data feeds are available from Dow Jones, Polygon.io, Alpha Vantage, Quandl, Marketstack, and dozens of others. The datafeeds will give your App and smart contract access to real-time data for tens of thousands of stocks, financial products, and cryptocurrencies.** 

Once you have an API key from your chosen data vendor, just insert that key into your off-chain compute endpoint. See `/AWS_code/turing_oracle.py` for working example code:

```python
/AWS_code/turing_oracle.py

...
  api_key = 'YOUR_API_KEY' # Insert your Dow Jones, Bloomberg, or Polygon.io API key here

  authorized_contract = None # for open access
  # or...
  authorized_contract = '0xOF_YOUR_HELPER_CONTRACT' # to restrict access to only your smart contract
...

``` 

You can lock-down your off-chain endpoint to only accept queries from your smart contract. To do this, just designate your smart contract's address on Boba as the `authorized_contract`. If you wish to allow open access, leave this variable blank.

## Detailed Technical Background and Implementation

The modified Turing L2Geth, `L2TGeth`, monitors callData for particular Keccak methodIDs of functions such as `function GetRandom(uint32 rType, uint256 _random)` and `function GetResponse(uint32 rType, string memory _url, bytes memory _payload)`. Upon finding such methodIDs anywhere in the execution flow, at any level, L2TGeth parses the callData for additional information, such as external URLs, and uses that information to either directly prepare a response (e.g. generate a random number) or to call an external API. After new information is generated (or has returned from the external API), L2TGeth then, and only then, runs the function with updated input callData, such that the new information flows back to the caller (via overloaded variables and a system for conditionally bypassing reverts). Put simply, L2TGeth intercepts function calls, adds new information to the callData, and then runs the function with the updated inputs.

In general, this system would lead to disagreement about the correct state of the underlying blockchain. For example, if replicas and verifiers simply ingested the transactions and re-executed them, then every blockchain would differ, destroying the entire system. Thus, a new data field called `Turing` (aka `turing`, `l1Turing` or `L1Turing` depending on context) has been added to the L2Geth `messages`, `receipts`, `blocks`, `evm.contexts`, and diverse `codecs` and `encoders/decoders`. This new data fields is understood by the `providers`, the `core-utils`, the `data-translation-layer`, and the `batch-submitter`, and allows Turing data to be pushed into, and recovered from, the `CanonicalTransactionContract` (CTC). This extra information allows all the verifiers and replicas to enter into a new **replay** mode, where instead of generating new random numbers (or calling off-chain for new data), they use the Turing data stored in the CTC (or in the L2 blocks) to generate a faithful copy of the main Boba L2 blockchain. Thus, the overall system works as before, with all the information needed for restoring the Boba L2 and, just as critically, for public fraud proving, being publicly deposited into Ethereum. 

### Quickstart for Turing Developers

Open a terminal window and from the top level:

```bash
$ yarn
$ yarn build
$ cd ops
$ BUILD=1 DAEMON=0 ./up_local.sh
```

This will spin up the entire stack. Then, open a second terminal window and:

```bash
$ cd packages/boba/turing
$ yarn test:boba

yarn run v1.22.15
$ hardhat --network boba_local test

  Basic Math
    Created local HTTP server at http://192.168.1.246:1235
    Helper contract deployed as 0x6BdBb69660E6849b98e8C524d266a0005D3655F7 on L2
    Test contract deployed as 0x9B06D17ce54B06dF4A644900492036E3AC384517
    ✓ should return the helper address
    ✓ test of local compute endpoint: should do basic math via direct server query
    ✓ should support floating point volume of sphere (76ms)
    ✓ should support floating point volume of sphere based on geth-cached result (65ms)

  Stableswap at AWS Lambda
    URL set to https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/swapy
    Helper contract deployed as 0xB0F974464eA9BbB2adA6a08B0AB226Cbc57F7261 on L2
    Stableswap contract deployed as 0x3495e761eBeb87991C6CD1137108Fd3e7D3c74ba
    ✓ should return the helper address
    ✓ should correctly swap X in for Y out (1048ms)

  Turing VRF
    Helper contract deployed at 0x488516e15E671491BdaB7f0b9c5045E670a80431 on L2
    Test contract deployed at 0xA1FeC3dff287464b6B3297404f839847A18ce184
    Turing 42 = 42
    ✓ should get the number 42 (92ms)
    Turing VRF 64 = 15595235597337684000
    ✓ should get a length 64 VRF (97ms)
    Turing VRF 64 = 3784560248718450000
    ✓ should get a length 64 VRF (96ms)

  Pull Bitcoin - USD quote
    URL set to https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/quote
    Helper contract deployed as 0x876E45ed3c0D488343B098350Cb717737a178848 on L2
    Lending contract deployed as 0xc6a2F25a6AE1a5b406A3E2E4B5C4f4cDb9F33316
    ✓ should return the helper address
     Bitcoin to usd price is 43864.85
     timestamp 1642027566490
    ✓ should get the current Bitcoin - USD price (753ms)

  11 passing (3s)

✨  Done in 6.76s.
```

### Implementation: Step 1

The first step is to call specific functions from within a smart contract, such as:

```javascript

uint256 random_number = turing.getRandom()

```

The modified `L2TGeth` will detect these function calls, intercept them, and obtain requested data from other sources (strong random number generators, off-chain APIs and datafeeds, ...).

```go
/l2geth/core/vm/evm.go

// Call executes the contract associated with the addr with the given input as
// parameters. It also handles any necessary value transfer required and takes
// the necessary steps to create accounts and reverses the state in case of an
// execution error or failed value transfer.
func (evm *EVM) Call(caller ContractRef, addr common.Address, input []byte, gas uint64, value *big.Int) (ret []byte, leftOverGas uint64, err error) {

...

  //methodID for GetResponse is 7d93616c -> [125 147 97 108]
  isTuring2 := bytes.Equal(input[:4], []byte{125, 147, 97, 108})

  //methodID for GetRandom is 493d57d6 -> [73 61 87 214]
  isGetRand2 := bytes.Equal(input[:4], []byte{73, 61, 87, 214})

  // TuringCall takes the original calldata, figures out what needs
  // to be done, and then synthesizes a 'updated_input' calldata
  var updated_input hexutil.Bytes

  if isTuring2 {
    if len(evm.Context.Turing) < 3 {
      // This is the first run of Turing for this transaction
      // We sometimes use a short evm.Context.Turing payload for debug purposes.
      // A real modified callData is always much much > 2 bytes
      // This case _should_ never happen in Verifier/Replica mode, since the sequencer will already have run the Turing call
      updated_input = bobaTuringCall(input, caller.Address())
      ret, err = run(evm, contract, updated_input, false)
      // and now, provide the updated_input to the context so that the data can be sent to L1 and the CTC
      /**************** CRITICAL LINE ****************/
      evm.Context.Turing = updated_input
      /**************** CRITICAL LINE ****************/
    } else {
      // Turing for this Transaction has already been run elsewhere - replay using
      // information from the EVM context
      ret, err = run(evm, contract, evm.Context.Turing, false)
    }
  } else if isGetRand2 {
    if len(evm.Context.Turing) < 3 {
      // See above - they apply 1:1 here too
      updated_input = bobaTuringRandom(input)
      ret, err = run(evm, contract, updated_input, false)

      /**************** CRITICAL LINE ****************/
      evm.Context.Turing = updated_input
      /**************** CRITICAL LINE ****************/
    } else {
      // Turing for this Transaction has already been run elsewhere - replay using
      // information from the EVM context
      ret, err = run(evm, contract, evm.Context.Turing, false)
    }
  } else {
    ret, err = run(evm, contract, input, false)
  }

...

```

The random number generation is done locally, inside the Geth, and off-chain APIs are queried with standard calls:

```go
/l2geth/core/vm/evm.go

// In response to an off-chain Turing request, obtain the requested data and
// rewrite the parameters so that the contract can be called without reverting.
func bobaTuringRandom(input []byte) hexutil.Bytes {

  var ret hexutil.Bytes
  rest := input[4:]
  inputHexUtil := hexutil.Bytes(input)

  // If things fail, we'll return an integer parameter which will fail a
  // "require" in the contract.
  retError := make([]byte, len(inputHexUtil))
  copy(retError, inputHexUtil)

  // Check the rType
  // 1 for Request, 2 for Response, integer >= 10 for various failures
  rType := int(rest[31])
  if rType != 1 {
    retError[35] = 10 // Wrong input state
    return retError
  }

  rlen := len(rest)
  if rlen < 2*32 {
    retError[35] = 11 // Calldata too short
    return retError
  }

  // generate a Uint64 random number
  // FIX FIX FIX Not Secure due to poor performance of /math/rand
  randomUint64 := rand.Uint64()

  // build the calldata
  methodID := make([]byte, 4)
  copy(methodID, inputHexUtil[0:4])
  ret = append(methodID, hexutil.MustDecode(fmt.Sprintf("0x%064x", 2))...)
  ret = append(ret, hexutil.MustDecode(fmt.Sprintf("0x%064x", randomUint64))...)

  return ret
}

// In response to an off-chain Turing request, obtain the requested data and
// rewrite the parameters so that the contract can be called without reverting.
func bobaTuringCall(input []byte, caller common.Address) hexutil.Bytes {

  var responseStringEnc string
  var responseString []byte

  rest := input[4:]
  inputHexUtil := hexutil.Bytes(input)
  restHexUtil := inputHexUtil[4:]

  retError := make([]byte, len(inputHexUtil))
  copy(retError, inputHexUtil)

  // Check the rType
  // 1 for Request, 2 for Response, integer >= 10 for various failures
  rType := int(rest[31])
  if rType != 1 {
    retError[35] = 10 // Wrong input state
    return retError
  }

  rlen := len(rest)
  if rlen < 7*32 {
    retError[35] = 11 // Calldata too short
    return retError
  }

  // A micro-ABI decoder... this works because we know that all these numbers can never exceed 256
  // Since the rType is 32 bytes and the three headers are 32 bytes each, the max possible value
  // of any of these numbers is 32 + 32 + 32 + 32 + 64 = 192
  // Thus, we only need to read one byte

  // 0  -  31 = rType
  // 32  -  63 = URL start
  // 64  -  95 = payload start
  // 96  - 127 = length URL string
  // 128 - ??? = URL string
  // ??? - ??? = payload length
  // ??? - end = payload

  startIDXurl := int(rest[63]) + 32
  // the +32 means that we are going directly for the actual string
  // bytes 0 to 31 are the string length

  startIDXpayload := int(rest[95]) // the start of the payload
  lengthURL := int(rest[127])      // the length of the URL string

  // Check the URL length
  // Note: we do not handle URLs that are longer than 64 characters
  if lengthURL > 64 {
    retError[35] = 12 // URL string > 64 bytes
    return retError
  }

  // The URL we are going to query
  endIDX := startIDXurl + lengthURL
  url := string(rest[startIDXurl:endIDX])
  // we use a specific end value (startIDXurl+lengthURL) since the URL is right-packed with zeros

  // At this point, we have the API endpoint and the payload that needs to go there...
  payload := restHexUtil[startIDXpayload:] //using hex here since that makes it easy to get the string

  log.Debug("TURING-4 bobaTuringCall:Have URL and payload",
    "url", url,
    "payload", payload)

  client, err := rpc.Dial(url)

  if client != nil {
    if err := client.Call(&responseStringEnc, caller.String(), payload); err != nil {
      retError[35] = 13 // Client Error
      return retError
    }
    responseString, err = hexutil.Decode(responseStringEnc)
    if err != nil {
      retError[35] = 14 // Client Response Decode Error
      return retError
    }
  } else {
    retError[35] = 15 // Could not create client
    return retError
  }

  // build the modified calldata
  ret := make([]byte, startIDXpayload+4)
  copy(ret, inputHexUtil[0:startIDXpayload+4]) // take the original input
  ret[35] = 2                                  // change byte 3 + 32 = 35 (rType) to indicate a valid response
  ret = append(ret, responseString...)         // and tack on the payload

  return ret
}

```

**Note - random number generation currently uses `math/rand` which *does not* produce suitably random numbers. An upgrade to a better random number generator such as `crypto/rand`(https://pkg.go.dev/crypto/rand) is pending.**

### Step 2

`l2geth/core/state_transition.go` gets the Turing data out from the context, and returns it to callers:

```go
/l2geth/core/state_transition.go:
   85   QueueOrigin() types.QueueOrigin
   86:  L1Turing() []byte
   87  }
   ..
  229  // returning the result including the used gas. It returns an error if failed.
  230  // An error indicates a consensus issue.
  231: func (st *StateTransition) TransitionDb() (ret []byte, usedGas uint64, failed bool, err error, turing []byte) {
  232   if err = st.preCheck(); err != nil {
  233       return
  ...
  262       st.state.SetNonce(msg.From(), st.state.GetNonce(msg.From())+1)
  263       ret, st.gas, vmerr = evm.Call(sender, st.to(), st.data, st.gas, st.value)
  264:      turing = evm.Context.Turing // Prepare the return Turing data
  265   }
  ...
  288:  return ret, st.gasUsed(), vmerr != nil, err, turing
  289  }
```

Then, `core.ApplyTransaction` emits the Turing data in its receipt, which is then used in `miner/worker.go` to push the data into the transaction metadata via `tx.SetL1Turing(receipt.Turing)`:

```go
/l2geth/miner/worker.go:
  768   receipt, err := core.ApplyTransaction(w.chainConfig, w.chain, &coinbase, w.current.gasPool, w.current.state, w.current.header, tx, &w.current.header.GasUsed, *w.chain.GetVMConfig())
  ...  
  774:  // TURING Update the tx metadata...
  775   if len(receipt.Turing) > 1 {
  776     tx.SetL1Turing(receipt.Turing) // add the Turing data into the transaction.meta structure
```

The Turing data are incorporated into new L2 blocks via `w.engine.FinalizeAndAssemble` - the Turing data are contained within the `w.current.txs` input.

```go
l2geth/miner/worker.go:

 1110   s := w.current.state.Copy()
 1111   // log.Debug("TURING worker.go final block", "depositing_txs", w.current.txs)
 1112:  block, err := w.engine.FinalizeAndAssemble(w.chain, w.current.header, s, w.current.txs, uncles, w.current.receipts)
 1113   if err != nil {
 1114     return err


```
At this point, the data are circulated to various places throughout the system as part of the block/transaction data. Notably, calls to the L2 for block/transaction data now return a new field, `l1Turing` to all callers.

### Step 3 - Batch Submitter Data Mangling

The batch submitter receives a transaction from the `L2Geth`, obtains the raw call string (`rawTransaction`) and the Turing callData (`l1Turing`), and if there is a real Turing event, as judged from the length of the Turing string, it appends those data to the raw call string. From the perspective of the CTC, it is receiving its normal batch payload.   

```javascript
// batch-submitter tx-batch-submitter.ts 

767 if (this._isSequencerTx(block)) {
      batchElement.isSequencerTx = true
      const turing = block.transactions[0].l1Turing
      let rawTransaction = block.transactions[0].rawTransaction
      if (turing.length > 4) {
        // We have a Turing event and associated payload
        // Add a spacer, remove the '0x', and tack on the Turing string
        rawTransaction = rawTransaction + '424242' + turing.slice(2) //Chop off the '0x' from the Turing string
        // TODO TODO TODO remove the entire '424242' business by explicitly providing the junction location data in some other way to the DTL
      }
      batchElement.rawTransaction = rawTransaction
    }

```

Current weaknesses of the design:

* The `turing.slice(2)` is not RLP encoded, to make it easier to debug. But, it would be better if this were RLP encoded, too, to save space. Right now we are writing strings mostly composed of zeros, to the CTC.
* The `rawTransaction.length` field in the payload header is currently not updated (it always just gives the original length of `block.transactions[0].rawTransaction`). Thus, a kludge is needed in the DTL. This weakness is described in more detail below. 
* Note that for a true Turing string, the first 4 bytes are known in advance - they are just the methodID of the Turing helper `GetRandom` or `GetResponse()`

```go
  //methodID for GetResponse is 7d93616c -> [125 147 97 108]
  isTuring2 := bytes.Equal(input[:4], []byte{125, 147, 97, 108})

  //methodID for GetRandom is 493d57d6 -> [73 61 87 214]
  isGetRand2 := bytes.Equal(input[:4], []byte{73, 61, 87, 214})
```

This means that the tacked-on Turing string is either `4242427d93616c` or `424242493d57d6`.

### Step 4 - Writing to the CTC

The batch-submitter writes the data to the CTC as usual. **The CTC does not know about Turing** - that was one of the goals, so we do not have to modify the L1 contracts.

### Step 5 - Reading from the CTC

The DTL reads from the CTC and unpacks the modified rawTransaction (which is now called `sequencerTransaction`). Critically, the DTL writes a slightly modified entry into its database, which has a new field called `turing`. This new field is also sent to callers that query the DTL for data. 

```javascript
// DTL services/l1-ingestion/handles/sequencer-batch-appended.ts

    console.log(`DTL parseSequencerBatchTransaction`, {
      sequencerTransaction: toHexString(sequencerTransaction),
    })

    // need to keep track of the original length so the pointer system for accessing
    // the individual transactions works correctly
    const sequencerTransaction_original_length = sequencerTransaction.length

    // DANGER DANGER DANGER - FIX
    const turingIndex = sequencerTransaction.indexOf('424242', 0, 'hex')
    let turing = Buffer.from('0')

    if (turingIndex > 0) {
      //we have turing payload
      turing = sequencerTransaction.slice(turingIndex + 3) // the +3 chops off the '424242' marker
      sequencerTransaction = sequencerTransaction.slice(0, turingIndex)
      console.log('Found a Turing payload at position:', {
        turingIndex,
        turing: toHexString(turing),
        sequencerTransaction: toHexString(sequencerTransaction),
      })
    }

    const decoded = decodeSequencerBatchTransaction(
      sequencerTransaction,
      l2ChainId
    )

    transactionEntries.push({
      index: extraData.prevTotalElements
        .add(BigNumber.from(transactionIndex))
        .toNumber(),
      batchIndex: extraData.batchIndex.toNumber(),
      blockNumber: BigNumber.from(context.blockNumber).toNumber(),
      timestamp: BigNumber.from(context.timestamp).toNumber(),
...
      data: toHexString(sequencerTransaction), // The restored rawTransaction minus any Turing bits
...
      turing: toHexString(turing),
    })

    nextTxPointer += 3 + sequencerTransaction_original_length 
```

**VULNERABILTY**

The DTL gets the length of each transaction from the header (located near offset `15 + 16 * i_context`), but we are **not currently updating this header field** after we append the Turing data in the batch submitter. **ToDo**: `if(turing) then update` the `transactionLength` field in the header. This will require changes in the `core-utils` encoder and/or the DTL. A fix to this approach  would avoid having to scan for certain bytes, notably '424242', which could be mis-used in an attack. For example, simply calling a contract with string somewhere in the callData with value '4242427d93616c' would trigger the DTL to store everything after that as a (spurious) Turing payload. This could allow an attacker to send arbitrary information into the DTL and into the L2TGeth. 

```javascript
/data-transport-layer/src/services/l1-ingestion/handlers/sequencer-batch-appended.ts:
  280    offset: number
  281  ): Buffer => {
  282:   const transactionLength = BigNumber.from(
  283      calldata.slice(offset, offset + 3)
  284    ).toNumber()
```

### Step 6 - Verifier data ingestion

The Verifier receives all the usual data from the DTL, but, if there was a Turing call, there is now an additional data field containing the rewritten callData as a HexString. The Turing data are obtained from incoming `json` data and are written into the transaction metadata, `meta.L1Turing = turing`:

```go
/l2geth/core/types/transaction_meta.go:
   38   L1Timestamp     uint64          `json:"l1Timestamp"`
   39:  L1Turing        []byte          `json:"l1Turing" gencodec:"required"`
   40   L1MessageSender *common.Address `json:"l1MessageSender" gencodec:"required"`
   ..
   55   l1Timestamp uint64,
   56:  l1Turing []byte,
   57   l1MessageSender *common.Address,
   ..
   64       L1Timestamp:     l1Timestamp,
   65:      L1Turing:        l1Turing,
   66       L1MessageSender: l1MessageSender,
   ..
  145   }
  146  
  147:  turing, err := common.ReadVarBytes(b, 0, 2048, "Turing")
  148   if err != nil {
  149       return nil, err
  150   }
  151:  if !isNullValue(turing) {
  152:      meta.L1Turing = turing
  153   }
```
