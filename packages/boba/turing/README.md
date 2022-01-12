# Basic Architecture of Turing and L2TGeth

## TLDR

Turing is a system for interating with the outside world from within solidity smart contracts. All data returned from external APIs, such as random numbers and real-time financial data, are deposited into a public data-storage contract on Ethereum Mainnet. This extra data allows replicas, verifiers, and fraud-detectors to reproduce and validate the Boba L2 blockchain, block by block. 

**The information given in this technical deep-dive is not needed to use Turing.** Using Turing is as easy as calling specific predesignated functions from inside your smart contract. For example, to obtain a random number for minting NFTs, call:

```javascript
uint256 random_number = turing.getRandom()
```

To obtain the latest BTC-USD exchange rate, call:

```javascript
urlStr = 'https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/quote'
rate = lending.getCurrentQuote(urlStr, "BTC/USD")
```

### Use of Turing to access real-time trading data from within your solidity smart contract

**Note - Boba does not provide trading data (except for deliberately delayed data for test and debugging purposes). To obtain real-time trading data, you will need to subscribe to any one of dozens of well-known trading data sources and obtain an api key from them. Real time data feeds are available from Dow Jones, Polygon.io, Alpha Vantage, Quandl, Marketstack, and dozens of others. The datafeeds will give your App and smart contract access to real-time data for tens of thousands of stocks, financial products, and cryptocurrencies.** 

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

The modified Turing L2Geth, `L2TGeth`, monitors callData for particular methodIDs of functions such as `function GetRandom(uint32 rType, uint256 _random)` and `function GetResponse(uint32 rType, string memory _url, bytes memory _payload)`. Upon finding such methodIDs anywhere in the execution flow, at any level, L2TGeth parses the callData for additional information, such as external URLs, and uses that information to either directly prepare a response (e.g. generate a random number) or to call an external API. After new information is generated (or has returned from the external API), L2TGeth then, and only then, runs the function with updated input callData, such that the new information flows back to the caller (via overloaded variables and a system by bypassing reverts). Put simply, L2TGeth intercepts function calls, adds new information to the callData, and then runs the function with the updated inputs.

In general, this system would lead to disagreemnt about the correct state of the underlying blockchain. For example, if Replicas and Verifiers simply ingested the transactions and re-executed them, then every blockchain would differ, destroying the entire system. Thus, a new data field called `Turing` (aka `turing`, `l1Turing` or `L1Turing` depending on context) has been added to the L2Geth `messages`, `reciepts`, `blocks`, `evm.contexts`, and diverse `codecs` and `encoders/decoders`. This new data fields is understood by the `providers`, the `core-utils`, the `data-translation-layer`, and the `batch-submitter`, and allows Turing data to be pushed into, and recovered from, the `CanonicalTransactionContract` (CTC). This extra information allows all gthe verifiers and replicas to enter into a new **replay** mode, where instead of generating new random numbers (or calling off-chain for new data), they use the Turing data stored in the CTC to generate a faithful copy of the main Boba L2 blockchain. Thus, the overall system works as before, with all the needed information being publically depostited into Ethereum for restoring the Boba L2 and, just as critically, for public fraud proving. 

## Implementation

### Step 1

The first step is to call specific functions from within your smart contract, such as:

```javascript
uint256 random_number = turing.getRandom()
```

The modified `L2TGeth` will detect these function calls.









### Step 2

`l2geth/core/state_transition.go` gets the Turing data out from the context, and returns it to callers

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

Then, the `miner/worker.go` takes the Turing data and pushes it into the transaction metadata:

```go
/l2geth/miner/worker.go:
  768   receipt, err := core.ApplyTransaction(w.chainConfig, w.chain, &coinbase, w.current.gasPool, w.current.state, w.current.header, tx, &w.current.header.GasUsed, *w.chain.GetVMConfig())
  ...  
  774:  // TURING Update the tx metadata...
  775   if len(receipt.Turing) > 1 {
  776     tx.SetL1Turing(receipt.Turing)
```

At this point, the data will be circulated to various places as part of the transaction metadata. 

### Step 3 - Batch Submitter Data Mangling

The batch submitter receives an transaction from the `L2Geth`, obtains the raw call string (`rawTransaction`) and the Turing callData (`l1Turing`), and if there is a real Turing event, as judged from the length of the Turing string, it appends those data to the raw call string. From the perspective of the CTC, it is receiving its normal batch payload.   

```javascript
// batch-submitter tx-batch-submitter.ts 

767 if (this._isSequencerTx(block)) {
      batchElement.isSequencerTx = true
      const turing = block.transactions[0].l1Turing
      let rawTransaction = block.transactions[0].rawTransaction
      if (turing.length > 4) {
        // We have a Turing event and associated payload
        // Add a spacer, remove the '0x', and tack on the turing string
        rawTransaction = rawTransaction + '424242' + turing.slice(2) //Chop off the '0x' from the Turing string
        // TODO TODO TODO remove the entire '424242' business by explicitely providing the junction location data in some other way to the DTL
      }
      batchElement.rawTransaction = rawTransaction
    }

```

Current weaknesses of the design:

* The `turing.slice(2)` is not RLP encoded, to make it easier to debug. But, it would be better if this were RLP encoded, too, to save space. Right now we are writing strings mostly composed of zeros, to the CTC.
* The `rawTransaction.length` field in the payload header is currently not updated (it always just gives the original length of `block.transactions[0].rawTransaction`). Thus, a kludge is needed in the DTL. This weakness is described in more detail below. 
* Note that for a true Turing string, the first 4 bytes are known in advance - they are just the methodID of the turing helper `GetRandom` or `GetResponse()`

```go
  //methodID for GetResponse is 7d93616c -> [125 147 97 108]
  isTuring2 := bytes.Equal(input[:4], []byte{125, 147, 97, 108})

  //methodID for GetRandom is 493d57d6 -> [73 61 87 214]
  isGetRand2 := bytes.Equal(input[:4], []byte{73, 61, 87, 214})
```

This means that the tacked-on Turing string is either `4242427d93616c` or `424242493d57d6`.

### Step 4 - Writing to the CTC

The batch-submitter writes the data to the CTC as usual. The CTC does not know about Turing - that was one of the goals, so we do not have to modify the L1 contracts.

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
















To accomodate that, the `transaction` structure has a new field, `Turing      hexutil.Bytes   `json:"turing"`

```go
rollup/sync_service.go
// transaction represents the return result of the remote server.
// It either came from a batch or was replicated from the sequencer.
type transaction struct {
    Index       uint64          `json:"index"`
    BatchIndex  uint64          `json:"batchIndex"`
    BlockNumber uint64          `json:"blockNumber"`
    Timestamp   uint64          `json:"timestamp"`
    Value       *hexutil.Big    `json:"value"`
    GasLimit    uint64          `json:"gasLimit,string"`
    Target      common.Address  `json:"target"`
    Origin      *common.Address `json:"origin"`
    Data        hexutil.Bytes   `json:"data"`
    QueueOrigin string          `json:"queueOrigin"`
    QueueIndex  *uint64         `json:"queueIndex"`
    Decoded     *decoded        `json:"decoded"`
    Turing      hexutil.Bytes   `json:"turing"`
}

```








