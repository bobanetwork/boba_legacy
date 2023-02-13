import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract } from 'ethers'
import { getBobaContractAt } from '@boba/contracts'

import { OptimismEnv } from './shared/env'

describe('Fast Messenge Relayer Test', async () => {
  let L1Message: Contract
  let L2Message: Contract

  let env: OptimismEnv

  before(async () => {
    env = await OptimismEnv.new()

    L1Message = await getBobaContractAt(
      'L1Message',
      env.addressesBOBA.L1Message,
      env.l1Wallet
    )

    L2Message = await getBobaContractAt(
      'L2Message',
      env.addressesBOBA.L2Message,
      env.l2Wallet
    )
  })

  it('should send message from L1 to L2', async () => {
    await env.waitForXDomainTransaction(L1Message.sendMessageL1ToL2())
  })

  it('should QUICKLY send message from L2 to L1 using the fast relayer', async () => {
    await env.waitForXDomainTransactionFast(
      L2Message.sendMessageL2ToL1({ gasLimit: 800000, gasPrice: 0 })
    )
  })
})
