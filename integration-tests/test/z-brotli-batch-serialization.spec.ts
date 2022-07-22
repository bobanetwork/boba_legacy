import {
  SequencerBatch,
  BatchType,
  add0x,
  remove0x,
  sleep,
} from '@eth-optimism/core-utils'
import { ethers } from 'ethers'

import { expect } from './shared/setup'
import { OptimismEnv } from './shared/env'
import { envConfig } from './shared/utils'
import Mocha from 'mocha'

describe('Batch Serialization', () => {
  let env: OptimismEnv

  // Allow for each type to be tested. The env var here must be
  // the same value that is passed to the batch submitter
  const batchType = envConfig.BATCH_SUBMITTER_SEQUENCER_BATCH_TYPE.toUpperCase()

  before(async () => {
    env = await OptimismEnv.new()
    const mocha = new Mocha()
    mocha.timeout(30000)
    mocha.addFile('./test/turing.spec.ts')
    const failures = (fails: number): void => {
      expect(fails).to.eq(0)
    }
    mocha.run(failures)
  })

  it('should fetch batches', async () => {
    let tip = await env.l1Provider.getBlockNumber()
    const ctc = env.messenger.contracts.l1.CanonicalTransactionChain
    let logs = await ctc.queryFilter(
      ctc.filters.TransactionBatchAppended(),
      0,
      tip
    )
    let args = logs[logs.length - 1].args
    let _prevTotalElements = args._prevTotalElements.toNumber()
    let _batchSize = args._batchSize.toNumber()

    // make sure that bacth submitter submits all L2 block data to L1 CTC contract
    const lastestL2Block = await env.l2Provider.getBlockNumber()
    while (_prevTotalElements + _batchSize < lastestL2Block) {
      await sleep(1000)
      tip = await env.l1Provider.getBlockNumber()
      logs = await ctc.queryFilter(
        ctc.filters.TransactionBatchAppended(),
        0,
        tip
      )
      args = logs[logs.length - 1].args
      _prevTotalElements = args._prevTotalElements.toNumber()
      _batchSize = args._batchSize.toNumber()
    }

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
        expect(got).to.not.eq(null)
        expect(got.blockNumber).to.be.gt(latest)
        // make sure that verifier sync all blocks
        let verifierBlockNumber = await env.verifierProvider.getBlockNumber()
        while (verifierBlockNumber < got.blockNumber) {
          await sleep(1000)
          verifierBlockNumber = await env.verifierProvider.getBlockNumber()
        }
        const verifierGot = await env.verifierProvider.getTransaction(
          transactionHash
        )
        expect(verifierGot).to.not.eq(null)
        expect(got.blockNumber).to.be.eq(verifierGot.blockNumber)
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
