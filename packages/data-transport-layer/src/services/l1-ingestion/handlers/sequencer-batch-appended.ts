/* Imports: External */
import { BigNumber, ethers, constants } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import {
  fromHexString,
  toHexString,
  toRpcHexString,
  remove0x,
  add0x,
} from '@eth-optimism/core-utils'
import { SequencerBatchAppendedEvent } from '@eth-optimism/contracts/dist/types/CanonicalTransactionChain'

/* Imports: Internal */
import { MissingElementError } from './errors'
import {
  DecodedSequencerBatchTransaction,
  SequencerBatchAppendedExtraData,
  SequencerBatchAppendedParsedEvent,
  TransactionBatchEntry,
  TransactionEntry,
  EventHandlerSet,
} from '../../../types'
import { parseSignatureVParam } from '../../../utils'

export const handleEventsSequencerBatchAppended: EventHandlerSet<
  SequencerBatchAppendedEvent,
  SequencerBatchAppendedExtraData,
  SequencerBatchAppendedParsedEvent
> = {
  getExtraData: async (event, l1RpcProvider) => {
    const l1Transaction = await event.getTransaction()
    const eventBlock = await event.getBlock()

    // TODO: We need to update our events so that we actually have enough information to parse this
    // batch without having to pull out this extra event. For the meantime, we need to find this
    // "TransactonBatchAppended" event to get the rest of the data.
    const CanonicalTransactionChain = getContractFactory(
      'CanonicalTransactionChain'
    )
      .attach(event.address)
      .connect(l1RpcProvider)

    const batchSubmissionEvent = (
      await CanonicalTransactionChain.queryFilter(
        CanonicalTransactionChain.filters.TransactionBatchAppended(),
        eventBlock.number,
        eventBlock.number
      )
    ).find((foundEvent: ethers.Event) => {
      // We might have more than one event in this block, so we specifically want to find a
      // "TransactonBatchAppended" event emitted immediately before the event in question.
      return (
        foundEvent.transactionHash === event.transactionHash &&
        foundEvent.logIndex === event.logIndex - 1
      )
    })

    if (!batchSubmissionEvent) {
      throw new Error(
        `Well, this really shouldn't happen. A SequencerBatchAppended event doesn't have a corresponding TransactionBatchAppended event.`
      )
    }

    return {
      timestamp: eventBlock.timestamp,
      blockNumber: eventBlock.number,
      submitter: l1Transaction.from,
      l1TransactionHash: l1Transaction.hash,
      l1TransactionData: l1Transaction.data,

      prevTotalElements: batchSubmissionEvent.args._prevTotalElements,
      batchIndex: batchSubmissionEvent.args._batchIndex,
      batchSize: batchSubmissionEvent.args._batchSize,
      batchRoot: batchSubmissionEvent.args._batchRoot,
      batchExtraData: batchSubmissionEvent.args._extraData,
    }
  },
  parseEvent: (event, extraData, l2ChainId) => {
    const transactionEntries: TransactionEntry[] = []

    // It's easier to deal with this data if it's a Buffer.
    const calldata = fromHexString(extraData.l1TransactionData)

    if (calldata.length < 12) {
      throw new Error(
        `Block ${extraData.blockNumber} transaction data is invalid for decoding: ${extraData.l1TransactionData} , ` +
          `converted buffer length is < 12.`
      )
    }
    const numContexts = BigNumber.from(calldata.slice(12, 15)).toNumber()
    let transactionIndex = 0
    let enqueuedCount = 0
    let nextTxPointer = 15 + 16 * numContexts
    for (let i = 0; i < numContexts; i++) {
      const contextPointer = 15 + 16 * i
      const context = parseSequencerBatchContext(calldata, contextPointer)

      for (let j = 0; j < context.numSequencedTransactions; j++) {
        const sequencerTransaction = parseSequencerBatchTransaction(
          calldata,
          nextTxPointer
        )

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
          data: toHexString(sequencerTransaction),
          queueOrigin: 'sequencer',
          value: decoded.value,
          queueIndex: null,
          decoded,
          confirmed: true,
          turing: decoded.turing,
        })

        nextTxPointer += 3 + sequencerTransaction.length
        transactionIndex++
      }

      for (let j = 0; j < context.numSubsequentQueueTransactions; j++) {
        const queueIndex = event.args._startingQueueIndex.add(
          BigNumber.from(enqueuedCount)
        )

        // Okay, so. Since events are processed in parallel, we don't know if the Enqueue
        // event associated with this queue element has already been processed. So we'll ask
        // the api to fetch that data for itself later on and we use fake values for some
        // fields. The real TODO here is to make sure we fix this data structure to avoid ugly
        // "dummy" fields.
        transactionEntries.push({
          index: extraData.prevTotalElements
            .add(BigNumber.from(transactionIndex))
            .toNumber(),
          batchIndex: extraData.batchIndex.toNumber(),
          blockNumber: BigNumber.from(0).toNumber(),
          timestamp: context.timestamp,
          gasLimit: BigNumber.from(0).toString(),
          target: constants.AddressZero,
          origin: constants.AddressZero,
          data: '0x',
          queueOrigin: 'l1',
          value: '0x0',
          queueIndex: queueIndex.toNumber(),
          decoded: null,
          confirmed: true,
          turing: '0x',
        })

        enqueuedCount++
        transactionIndex++
      }
    }

    const transactionBatchEntry: TransactionBatchEntry = {
      index: extraData.batchIndex.toNumber(),
      root: extraData.batchRoot,
      size: extraData.batchSize.toNumber(),
      prevTotalElements: extraData.prevTotalElements.toNumber(),
      extraData: extraData.batchExtraData,
      blockNumber: BigNumber.from(extraData.blockNumber).toNumber(),
      timestamp: BigNumber.from(extraData.timestamp).toNumber(),
      submitter: extraData.submitter,
      l1TransactionHash: extraData.l1TransactionHash,
    }

    return {
      transactionBatchEntry,
      transactionEntries,
    }
  },
  storeEvent: async (entry, db) => {
    // Defend against situations where we missed an event because the RPC provider
    // (infura/alchemy/whatever) is missing an event.
    if (entry.transactionBatchEntry.index > 0) {
      const prevTransactionBatchEntry = await db.getTransactionBatchByIndex(
        entry.transactionBatchEntry.index - 1
      )

      // We should *always* have a previous transaction batch here.
      if (prevTransactionBatchEntry === null) {
        throw new MissingElementError('SequencerBatchAppended')
      }
    }

    await db.putTransactionBatchEntries([entry.transactionBatchEntry])
    await db.putTransactionEntries(entry.transactionEntries)

    // Add an additional field to the enqueued transactions in the database
    // if they have already been confirmed
    for (const transactionEntry of entry.transactionEntries) {
      if (transactionEntry.queueOrigin === 'l1') {
        await db.putTransactionIndexByQueueIndex(
          transactionEntry.queueIndex,
          transactionEntry.index
        )
      }
    }
  },
}

interface SequencerBatchContext {
  numSequencedTransactions: number
  numSubsequentQueueTransactions: number
  timestamp: number
  blockNumber: number
}

const parseSequencerBatchContext = (
  calldata: Buffer,
  offset: number
): SequencerBatchContext => {
  return {
    numSequencedTransactions: BigNumber.from(
      calldata.slice(offset, offset + 3)
    ).toNumber(),
    numSubsequentQueueTransactions: BigNumber.from(
      calldata.slice(offset + 3, offset + 6)
    ).toNumber(),
    timestamp: BigNumber.from(
      calldata.slice(offset + 6, offset + 11)
    ).toNumber(),
    blockNumber: BigNumber.from(
      calldata.slice(offset + 11, offset + 16)
    ).toNumber(),
  }
}

const parseSequencerBatchTransaction = (
  calldata: Buffer,
  offset: number
): Buffer => {
  const transactionLength = BigNumber.from(
    calldata.slice(offset, offset + 3)
  ).toNumber()

  return calldata.slice(offset + 3, offset + 3 + transactionLength)
}

const decodeSequencerBatchTransaction = (
  transaction: Buffer,
  l2ChainId: number
): DecodedSequencerBatchTransaction => {
  const decodedTx = ethers.utils.parseTransaction(transaction)
  console.log('Decoding TX', { transaction, decodedTx })

  let restoredData = ''
  let turing = ''

  ;[restoredData, turing] = turingParse(decodedTx.data)
  console.log('Decoded TX', { restoredData, turing })

  return {
    nonce: BigNumber.from(decodedTx.nonce).toString(),
    gasPrice: BigNumber.from(decodedTx.gasPrice).toString(),
    gasLimit: BigNumber.from(decodedTx.gasLimit).toString(),
    value: toRpcHexString(decodedTx.value),
    target: decodedTx.to ? toHexString(decodedTx.to) : null,
    data: restoredData, // toHexString(decodedTx.data),
    sig: {
      v: parseSignatureVParam(decodedTx.v, l2ChainId),
      r: toHexString(decodedTx.r),
      s: toHexString(decodedTx.s),
    },
    turing,
  }
}

const turingParse = (decodedTxData: string): [string, string] => {
  // This MIGHT have a Turing payload inside of it...
  let dataHexString = remove0x(decodedTxData)

  let turingHexString = ''
  console.log('TuringParse: Decoded TX', { dataHexString })

  // First, parse the version and length field...
  // TuringVersion not used right now; for future use and for supporting legacy packets
  const turingVersion = parseInt(dataHexString.slice(0, 2), 16)

  const turingLength = parseInt(dataHexString.slice(2, 6), 16) * 2 // * 2 because we are operating on the hex string

  // methodID for GetResponse is 7d93616c -> [125 147 97 108]
  // methodID for GetRandom   is 493d57d6 -> [ 73  61 87 214]

  console.log('Turing:', {
    turingVersion,
    turingLength,
    dataLength: dataHexString.length,
  })

  if (
    turingVersion === 1 &&
    turingLength > 0 && // yes we have a Turing payload
    turingLength < dataHexString.length // and the length is not corrupted and will not overrun the string length
  ) {
    const turingCandidate = dataHexString.slice(-turingLength)
    console.log('turingCandidate', { turingCandidate })

    const turingCall = turingCandidate.slice(0, 8).toLowerCase()
    console.log('turingCall', { turingCall })

    if (turingCall === '7d93616c' || turingCall === '493d57d6') {
      // we are all set! we have a Turing v1 payload
      turingHexString = dataHexString.slice(-turingLength)
      dataHexString = dataHexString.slice(6, -turingLength)
      // The `3` chops off the Turing length header field, and the `-turingLength` chops off the Turing bytes
      console.log('Found a Turing TX:', {
        turingLength,
        turing: turingHexString,
        restoredData: dataHexString,
      })
      return [add0x(dataHexString), add0x(turingHexString)]
    } else {
      // don't do anything
      // unknown/corrupted/legacy format
      // In this case, will add '0x', the default, by doing nothing
      console.log('ERROR TURING TX - UNKNOWN OR CORRUPTED FORMAT', {
        turingLength,
        turing: '0x',
        restoredData: dataHexString,
      })
      return [add0x(dataHexString), '0x']
    }
  } else if (turingVersion === 1 && turingLength === 0) {
    // The `3` chops off the Turing version and length header field, which is in this case (0: 01 1: 00 2: 00)
    dataHexString = dataHexString.slice(6)
    console.log('Found a non-Turing TX:', {
      turingLength,
      turing: '0x', // this will be '0x'
      restoredData: dataHexString,
    })
    return [add0x(dataHexString), '0x']
  } else {
    console.log('Found a LEGACY TX:', {
      turingLength,
      turing: '0x',
      restoredData: dataHexString,
    })
    return [add0x(dataHexString), '0x']
  }
}
