import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'

import { sleep } from '@eth-optimism/core-utils'

import { OptimismEnv } from './env'

export const verifyStateRoots = async () => {
  const env: OptimismEnv = await OptimismEnv.new()

  const StateCommitmentChainAddress = await env.addressesBASE
    .StateCommitmentChain

  const StateCommitmentChain: Contract = getContractFactory(
    'StateCommitmentChain',
    env.l1Wallet
  ).attach(StateCommitmentChainAddress)

  // get latest state root from SCC contract
  // verify last 5000 blocks?
  const blockInterval = 5000
  const l1BlockNumber = await env.l1Provider.getBlockNumber()
  const startBlock = Math.max(l1BlockNumber - blockInterval, 0)

  const events = await StateCommitmentChain.queryFilter(
    StateCommitmentChain.filters.StateBatchAppended(),
    startBlock,
    l1BlockNumber
  )
  console.log(events.length)
  if (events.length === 0) {
    console.log('There were no StateBatchAppended events')
    return false
  }

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
      const l2BlockReceipt = await env.l2Provider.send('eth_getBlockByNumber', [
        utils.hexValue(l2BlockNumber),
        true,
      ])
      const [l2VerifierBlockReceipt, l2ReplicaBlockReceipt] =
        await pullForBlock(env, l2BlockNumber)
      const l2StateRoot = l2BlockReceipt.stateRoot
      const l2VerifierStateRoot = l2VerifierBlockReceipt.stateRoot
      const l2ReplicaStateRoot = l2ReplicaBlockReceipt.stateRoot
      const SCCStateRoot = stateRoots[l2BlockNumber - _prevTotalElements - 1]
      expect(l2StateRoot).to.be.deep.eq(
        l2VerifierStateRoot,
        'l2StateRoot does not match l2VerifierStateRoot'
      )
      expect(l2StateRoot).to.be.deep.eq(
        l2ReplicaStateRoot,
        'l2StateRoot does not match l2ReplicaStateRoot'
      )
      expect(l2StateRoot).to.be.deep.eq(
        SCCStateRoot,
        'l2StateRoot does not match SCCStateRoot'
      )
      l2BlockNumber += 1
    }
  }
  return true
}
export const pullForBlock = async (env, l2BlockNumber) => {
  while (true) {
    const l2VerifierBlockReceipt = await env.verifierProvider.send(
      'eth_getBlockByNumber',
      [utils.hexValue(l2BlockNumber), true]
    )
    const l2ReplicaBlockReceipt = await env.replicaProvider.send(
      'eth_getBlockByNumber',
      [utils.hexValue(l2BlockNumber), true]
    )
    if (l2VerifierBlockReceipt !== null && l2ReplicaBlockReceipt !== null) {
      return [l2VerifierBlockReceipt, l2ReplicaBlockReceipt]
    }
    await sleep(2000)
  }
}
