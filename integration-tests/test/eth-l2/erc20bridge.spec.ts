import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, utils, Wallet } from 'ethers'
import { getBobaContractAt } from '@bobanetwork/contracts'

import { OptimismEnv } from './shared/env'

describe('ERC20 Bridge', async () => {
  let L1ERC20: Contract
  let L2ERC20: Contract

  let env: OptimismEnv

  const depositERC20ToL2 = async (toWallet: Wallet) => {
    const depositL2ERC20Amount = utils.parseEther('12345')

    const approveL1ERC20TX = await L1ERC20.approve(
      env.l1Bridge.address,
      depositL2ERC20Amount
    )
    await approveL1ERC20TX.wait()

    const deposit = env.l1Bridge.depositERC20To(
      L1ERC20.address,
      L2ERC20.address,
      toWallet.address,
      depositL2ERC20Amount,
      9999999,
      utils.formatBytes32String(new Date().getTime().toString())
    )
    await env.waitForXDomainTransaction(deposit)
  }

  before(async () => {
    env = await OptimismEnv.new()

    //let's tap into the contract we just deployed
    L1ERC20 = await getBobaContractAt(
      'L1ERC20',
      env.addressesBOBA.TOKENS.TEST.L1,
      env.l1Wallet
    )
    //let's tap into the contract we just deployed
    L2ERC20 = await getBobaContractAt(
      'L1ERC20',
      env.addressesBOBA.TOKENS.TEST.L2,
      env.l2Wallet
    )
  })

  it('should use the recently deployed ERC20 TEST token and send some from L1 to L2', async () => {
    const preL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const preL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    const depositL2ERC20Amount = utils.parseEther('12345')

    const approveL1ERC20TX = await L1ERC20.approve(
      env.l1Bridge.address,
      depositL2ERC20Amount
    )
    await approveL1ERC20TX.wait()

    const deposit = env.l1Bridge.depositERC20(
      L1ERC20.address,
      L2ERC20.address,
      depositL2ERC20Amount,
      9999999,
      utils.formatBytes32String(new Date().getTime().toString())
    )
    await env.waitForXDomainTransaction(deposit)
    const postL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const postL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    expect(preL1ERC20Balance).to.deep.eq(
      postL1ERC20Balance.add(depositL2ERC20Amount)
    )

    expect(preL2ERC20Balance).to.deep.eq(
      postL2ERC20Balance.sub(depositL2ERC20Amount)
    )
  })

  it('should transfer ERC20 TEST token to Kate', async () => {
    const transferL2ERC20Amount = utils.parseEther('9')
    await depositERC20ToL2(env.l2Wallet)
    const preKateL2ERC20Balance = await L2ERC20.balanceOf(
      env.l2Wallet_2.address
    )
    const transferToKateTX = await L2ERC20.transfer(
      env.l2Wallet_2.address,
      transferL2ERC20Amount,
      { gasLimit: 9440000 }
    )
    await transferToKateTX.wait()

    const postKateL2ERC20Balance = await L2ERC20.balanceOf(
      env.l2Wallet_2.address
    )

    expect(postKateL2ERC20Balance).to.deep.eq(
      preKateL2ERC20Balance.add(transferL2ERC20Amount)
    )
  })
})
