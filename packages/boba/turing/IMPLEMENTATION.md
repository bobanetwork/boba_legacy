

# Basic Architecture of Turing and L2TGeth

## Simplified overview

The modified Turing L2Geth, `L2TGeth`, monitors callData for particular methodIDs of functions such as `function GetRandom(uint32 rType, uint256 _random)` and `function GetResponse(uint32 rType, string memory _url, bytes memory _payload)`. Upon finding such methodIDs anywhere in the execution flow, at any level, L2TGeth parses the callData for additional information, such as external URLs, and uses that information to either directly prepare a response (e.g. generate a random number) or to call an external API. After new information is generated (or has returned from the external API), L2TGeth then, and only then, runs the function with updated input callData, such that the new information flows back to the caller (via overloaded variables and a system by bypassing reverts). Put simply, L2TGeth intercepts function calls, adds new information to the callData, and then runs the function with the updated inputs.

In general, this system would lead to disagreemnt about the correct state of the underlying blockchain. For example, if Replicas and Verifiers simply ingested the transactions and re-executed them, then every blockchain would differ, destroying the entire system. Thus, a new data field called `Turing` (aka `turing`, `l1Turing` or `L1Turing` depending on context) has been added to the L2Geth `messages`, `reciepts`, `blocks`, `evm.contexts`, and diverse `codecs` and `encoders/decoders`. This new data fields is understood by the `providers`, the `core-utils`, the `data-translation-layer`, and the `batch-submitter`, and allows Turing data to be pushed into, and recovered from, the `CanonicalTransactionContract` (CTC). This extra information allows all gthe verifiers and replicas to enter into a new **replay** mode, where instead of generating new random numbers (or calling off-chain for new data), they use the Turing data stored in the CTC to generate a faithful copy of the main Boba L2 blockchain. Thus, the overall system works as before, with all the needed information being publically depostited into Ethereum for restoring the Boba L2 and, just as critically, for public fraud proving. 

## Implementation

### Step 1


### Step 2

`l2geth/core/state_transition.go` gets the Turing data out from the context, and returns it to callers

```go
l2geth/core/state_transition.go:
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

### Step 3 - Batch Submitter Data Mangling

The batch submitter receives an transaction from the `L2Geth`, obtains the raw call string (`rawTransaction`) and the Turing callData (`l1Turing`), and if there is a real Turing event, as judged from the length of the Turing string, it appends those data to the raw call string. From the perspective of the CTC, it is receiving its normal batch payload.   

```javascript
// batch-submitter tx-batch-submitter.ts 

767 if (this._isSequencerTx(block)) {
      batchElement.isSequencerTx = true
      const turing = block.transactions[0].l1Turing
      let rawTransaction = block.transactions[0].rawTransaction
      if (turing.length > 4) {
        //we have a nonzero turing payload
        //add a spacer, remove the '0x', and tack on the turing string
        rawTransaction = rawTransaction + '424242' + turing.slice(2) //Chop off the '0x' from the Turing string
      }
      batchElement.rawTransaction = rawTransaction
    }

```

Current weaknesses of the design:

* The `turing.slice(2)` is not RLP encoded, to make it easier to debug. But, it would be better if this were RLP encoded, too, to save space. Right now we are writing strings, mostly composed of zeros, to the CTC.
* The `rawTransaction.length` field in the payload header is currently not updated (it always just gives the original length of `block.transactions[0].rawTransaction`). Thus, a kludge is needed in the DTL.
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

The DTL reads from the CTC and unpacks the modified rawTransaction (which is now called `sequencerTransaction`). Critically, the DTL writes a slightly modified entry into is database, which has a new field called `turing`. This new field is also sent to callers that query the DTL for data. 

```javascript
// DTL services/l1-ingestion/handles/sequencer-batch-appended.ts

    console.log(`DTL parseSequencerBatchTransaction`, {
      sequencerTransaction: toHexString(sequencerTransaction),
    })

    const turingIndex = sequencerTransaction.indexOf('424242', 0, 'hex')
    let turing = Buffer.from('0')
    let turingExtraLength = 0

    if (turingIndex > 0) {
      //we have turing payload
      turing = sequencerTransaction.slice(turingIndex + 3) // the +3 chops off the '424242' marker
      // Turing HACK HACK HACK
      // fix the nextTxPointer so that we start at the beginning of the next real transaction
      turingExtraLength = turing.length + 3 
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
      gasLimit: BigNumber.from(0).toString(),
      target: constants.AddressZero,
      origin: null,
      data: toHexString(sequencerTransaction), // The restored rawTransaction minus any Turing bits
      queueOrigin: 'sequencer',
      value: decoded ? decoded.value : '0x0',
      queueIndex: null,
      decoded,
      confirmed: true,
      turing: toHexString(turing), // NEW FIELD HERE
    })

    // Turing HACK HACK HACK
    nextTxPointer += 3 + sequencerTransaction.length + turingExtraLength 
    // Long term actual fix is to have a correct value for each sequencerTransaction.length
    // but that's actually quite difficult to do based on where we are modifying the callData
````

### Step 6 - Verifier data ingestion

The Verifier receives all the usual data from the DTL, but, if there was a turing call, there is now an additional data field containing the rewritten callData as a HexString. The Turing data are obtained from incoming `json` data and are written into the transaction metadata, `meta.L1Turing = turing`:

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








