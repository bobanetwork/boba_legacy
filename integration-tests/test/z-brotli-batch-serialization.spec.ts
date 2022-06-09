import {
  SequencerBatch,
  BatchType,
  add0x,
  remove0x,
} from '@eth-optimism/core-utils'

import { expect } from './shared/setup'
import { OptimismEnv } from './shared/env'
import { envConfig } from './shared/utils'
import { ethers } from 'ethers'

describe('Batch Serialization', () => {
  let env: OptimismEnv
  // Allow for each type to be tested. The env var here must be
  // the same value that is passed to the batch submitter
  const batchType = envConfig.BATCH_SUBMITTER_SEQUENCER_BATCH_TYPE.toUpperCase()
  before(async () => {
    env = await OptimismEnv.new()
  })

  it('{tag:boba} should fetch batches', async () => {
    const tip = await env.l1Provider.getBlockNumber()
    const ctc = env.messenger.contracts.l1.CanonicalTransactionChain
    const logs = await ctc.queryFilter(
      ctc.filters.TransactionBatchAppended(),
      0,
      tip
    )
    // collect all of the batches
    const batches = []
    for (const log of logs) {
      const tx = await env.l1Provider.getTransaction(log.transactionHash)
      batches.push(tx.data)
    }

    expect(batches.length).to.be.gt(0, 'Submit some batches first')

    let latest = 0
    // decode all of the batches
    for (const batch of batches) {
      // Typings don't work?
      const decoded = (SequencerBatch as any).fromHex(batch)
      expect(decoded.type).to.eq(BatchType[batchType])

      // Iterate over all of the transactions, fetch them
      // by hash and make sure their blocknumbers are in
      // ascending order. This lets us skip handling deposits here
      for (const transaction of decoded.transactions) {
        const tx = transaction.toTransaction()
        const restoredData = turingParse_v1(tx.data)
        tx.data = restoredData
        const serializedTx = ethers.utils.serializeTransaction(
          {
            nonce: tx.nonce,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            value: tx.value,
            to: tx.to,
            data: tx.data,
            chainId: tx.chainId,
          },
          { r: tx.r, v: tx.v, s: tx.s }
        )
        const transactionHash = ethers.utils.keccak256(serializedTx)
        const got = await env.l2Provider.getTransaction(transactionHash)
        const verifierGot = await env.verifierProvider.getTransaction(
          transactionHash
        )
        expect(got).to.not.eq(null)
        expect(verifierGot).to.not.eq(null)
        expect(got.blockNumber).to.be.gt(latest)
        expect(got.blockNumber).to.be.gt(verifierGot.blockNumber)
        latest = got.blockNumber
      }
    }
  })
})

const turingParse_v1 = (decodedTxData: string): string => {
  // This MIGHT have a Turing payload inside of it...
  let dataHexString = remove0x(decodedTxData)

  // First, parse the version and length field...
  // TuringVersion not used right now; for future use and for supporting legacy packets
  const turingLength = parseInt(dataHexString.slice(2, 6), 16) * 2 // * 2 because we are operating on the hex string

  if (turingLength === 0) {
    // The .slice(headerLength) chops off the Turing header
    // '6' is correct here because we are operating on the string
    dataHexString = dataHexString.slice(6)
    return add0x(dataHexString)
  } else if (turingLength > 0 && turingLength < dataHexString.length) {
    const turingCandidate = dataHexString.slice(-turingLength)

    const turingCall = turingCandidate.slice(0, 8).toLowerCase()

    // methodID for GetResponse is 7d93616c -> [125 147 97 108]
    // methodID for GetRandom   is 493d57d6 -> [ 73  61 87 214]
    if (turingCall === '7d93616c' || turingCall === '493d57d6') {
      // we are all set! we have a Turing v1 payload
      dataHexString = dataHexString.slice(6, -turingLength)
      // The `headerLength` chops off the Turing length header field, and the `-turingLength` chops off the Turing bytes
      // '6' is correct here because we are operating on the string
      return add0x(dataHexString)
    } else {
      // unknown/corrupted/legacy format
      // In this case, will add '0x', the default, and do nothing
      return add0x(dataHexString)
    }
  } else {
    // unknown/corrupted/legacy format
    // In this case, will add '0x', the default, and do nothing
    return add0x(dataHexString)
  }
}

export const parseSignatureVParam = (
  v: number | ethers.BigNumber | string,
  chainId: number
): number => {
  v = ethers.BigNumber.from(v).toNumber()
  // Handle unprotected transactions
  if (v === 27 || v === 28) {
    return v
  }
  // Handle EIP155 transactions
  return v - 2 * chainId - 35
}
