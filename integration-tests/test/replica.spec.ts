import chai, { expect } from 'chai'
import { Wallet, Contract, ContractFactory, providers } from 'ethers'
import { ethers } from 'hardhat'
import { injectL2Context } from '@eth-optimism/core-utils'

import {
  sleep,
  l2Provider,
  replicaProvider,
  waitForL2Geth,
} from './shared/utils'
import { OptimismEnv } from './shared/env'

describe('Syncing a replica', () => {
  let env: OptimismEnv
  let wallet: Wallet
  //let provider: providers.JsonRpcProvider

  const sequencerProvider = injectL2Context(l2Provider)
  const repProvider = injectL2Context(replicaProvider)

  /* Helper functions */

  const syncReplica = async (sequencerBlockNumber: number) => {
    // Wait until replica has caught up to the sequencer
    let latestReplicaBlock = (await repProvider.getBlock('latest')) as any
    while (latestReplicaBlock.number < sequencerBlockNumber) {
      await sleep(500)
      latestReplicaBlock = (await repProvider.getBlock('latest')) as any
    }

    return repProvider.getBlock(sequencerBlockNumber)
  }

  before(async () => {
    env = await OptimismEnv.new()
    wallet = env.l2Wallet
  })

  describe('Basic transactions and ERC20s', () => {
    const initialAmount = 1000
    const tokenName = 'OVM Test'
    const tokenDecimals = 8
    const TokenSymbol = 'OVM'

    let other: Wallet
    let Factory__ERC20: ContractFactory
    let ERC20: Contract

    before(async () => {
      other = Wallet.createRandom().connect(ethers.provider)
      Factory__ERC20 = await ethers.getContractFactory('ERC20', wallet)
    })

    it('{tag:boba} should sync dummy transaction', async () => {
      const tx = {
        to: '0x' + '1234'.repeat(10),
        gasLimit: 4000000,
        gasPrice: 0,
        data: '0x',
        value: 0,
      }
      const result = await wallet.sendTransaction(tx)
      await result.wait()

      const latestSequencerBlock = (await sequencerProvider.getBlock(
        'latest'
      )) as any

      const matchingReplicaBlock = (await syncReplica(
        latestSequencerBlock.number
      )) as any

      expect(matchingReplicaBlock.stateRoot).to.eq(
        latestSequencerBlock.stateRoot
      )
    })

    it('{tag:boba} should sync ERC20 deployment and transfer', async () => {
      ERC20 = await Factory__ERC20.deploy(
        initialAmount,
        tokenName,
        tokenDecimals,
        TokenSymbol
      )

      const transfer = await ERC20.transfer(other.address, 100)
      await transfer.wait()

      const latestSequencerBlock = (await sequencerProvider.getBlock(
        'latest'
      )) as any

      const matchingReplicaBlock = (await syncReplica(
        latestSequencerBlock.number
      )) as any

      expect(matchingReplicaBlock.stateRoot).to.eq(
        latestSequencerBlock.stateRoot
      )
    })
  })
})
