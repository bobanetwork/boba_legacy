import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, utils } from 'ethers'
import chalk from 'chalk'

import { Direction } from './shared/watcher-utils'

import L1MessageJson from '@boba/contracts/artifacts/contracts/test-helpers/Message/L1Message.sol/L1Message.json'
import L2MessageJson from '@boba/contracts/artifacts/contracts/test-helpers/Message/L2Message.sol/L2Message.json'
import { OptimismEnv } from './shared/env'

describe('Fast Messenge Relayer Test', async () => {
  let L1Message: Contract
  let L2Message: Contract

  let env: OptimismEnv

  before(async () => {
    env = await OptimismEnv.new()

    L1Message = new Contract(
      env.addressesBOBA.L1Message,
      L1MessageJson.abi,
      env.l1Wallet
    )

    L2Message = new Contract(
      env.addressesBOBA.L2Message,
      L2MessageJson.abi,
      env.l2Wallet
    )
  })

  it('{tag:boba} should send message from L1 to L2', async () => {
    await env.waitForXDomainTransaction(
      L1Message.sendMessageL1ToL2(),
      Direction.L1ToL2
    )
  })

  it('{tag:boba} should QUICKLY send message from L2 to L1 using the fast relayer', async () => {
    await env.waitForXDomainTransactionFast(
      L2Message.sendMessageL2ToL1({ gasLimit: 800000, gasPrice: 0 }),
      Direction.L2ToL1
    )
  })
})
