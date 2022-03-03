import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'

import { OptimismEnv } from './shared/env'

describe('Verify State Roots', async () => {
  let StateCommitmentChain: Contract

  let env: OptimismEnv

  before(async () => {
    env = await OptimismEnv.new()

    const StateCommitmentChainAddress = await env.addressManager.getAddress(
      'StateCommitmentChain'
    )

    StateCommitmentChain = getContractFactory(
      'StateCommitmentChain',
      env.l1Wallet
    ).attach(StateCommitmentChainAddress)
  })

  it('{tag:other} State roots should match', async () => {
    // get latest state root from SCC contract
    const blockInterval = 5000
    const l1BlockNumber = await env.l1Provider.getBlockNumber()
    const startBlock = Math.max(l1BlockNumber - blockInterval, 0)

    const events = await StateCommitmentChain.queryFilter(
      StateCommitmentChain.filters.StateBatchAppended(),
      startBlock,
      l1BlockNumber
    )

    expect(events.length).to.not.eq('0')

    for (const event of events) {
      const hash = event.transactionHash
      const tx = await env.l1Provider.getTransaction(hash)
      const payload = StateCommitmentChain.interface.parseTransaction({
        data: tx.data,
      })
      const stateRoots = payload.args._batch

      const args = event.args
      const _batchSize = args._batchSize.toNumber()
      const _prevTotalElements = args._prevTotalElements.toNumber()

      // Verifying the state roots
      let l2BlockNumber = _prevTotalElements + 1
      while (l2BlockNumber <= _batchSize + _prevTotalElements) {
        const l2BlockReceipt = await env.l2Provider.send(
          'eth_getBlockByNumber',
          [utils.hexValue(l2BlockNumber), true]
        )
        const l2VerifierBlockReceipt = await env.verifierProvider.send(
          'eth_getBlockByNumber',
          [utils.hexValue(l2BlockNumber), true]
        )
        const l2ReplicaBlockReceipt = await env.replicaProvider.send(
          'eth_getBlockByNumber',
          [utils.hexValue(l2BlockNumber), true]
        )
        const l2StateRoot = l2BlockReceipt.stateRoot
        const l2VerifierStateRoot = l2VerifierBlockReceipt.stateRoot
        const l2ReplicaStateRoot = l2ReplicaBlockReceipt.stateRoot
        const SCCStateRoot = stateRoots[l2BlockNumber - _prevTotalElements - 1]

        expect(l2StateRoot).to.be.deep.eq(l2VerifierStateRoot)
        expect(l2StateRoot).to.be.deep.eq(l2ReplicaStateRoot)
        expect(l2StateRoot).to.be.deep.eq(SCCStateRoot)

        l2BlockNumber += 1
      }
    }
  })
})
