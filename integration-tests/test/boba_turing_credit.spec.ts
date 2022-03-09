import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, BigNumber, utils, ethers, ContractFactory } from 'ethers'
import { Direction } from './shared/watcher-utils'
import { getContractFactory } from '@eth-optimism/contracts'

import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import TuringHelperJson from '@boba/turing-hybrid-compute/artifacts/contracts/TuringHelper.sol/TuringHelper.json'

import TuringTestJson from '../artifacts/contracts/TuringTest.sol/TuringTest.json'

import { OptimismEnv } from './shared/env'
import { verifyStateRoots } from './shared/state-root-verification'

describe('Boba Turing Credit Test', async () => {
  let BobaTuringHelper: Contract
  let BobaTuringCredit: Contract
  let L1StandardBridge: Contract

  let L1BOBAToken: Contract
  let L2BOBAToken: Contract

  let TuringHelper: Contract
  let Factory__TuringHelper: ContractFactory

  let TuringTest: Contract
  let Factory__TuringTest: ContractFactory

  let env: OptimismEnv

  before(async () => {
    env = await OptimismEnv.new()

    const BobaTuringCreditAddress = await env.addressManager.getAddress(
      'Proxy__BobaTuringCredit'
    )

    BobaTuringCredit = getContractFactory(
      'BobaTuringCredit',
      env.l2Wallet
    ).attach(BobaTuringCreditAddress)

    L1BOBAToken = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L1,
      L1ERC20Json.abi,
      env.l1Wallet
    )

    L2BOBAToken = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L2,
      L2GovernanceERC20Json.abi,
      env.l2Wallet
    )

    Factory__TuringHelper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      env.l2Wallet
    )
    TuringHelper = await Factory__TuringHelper.deploy()
    await TuringHelper.deployTransaction.wait()

    Factory__TuringTest = new ContractFactory(
      TuringTestJson.abi,
      TuringTestJson.bytecode,
      env.l2Wallet
    )
    TuringTest = await Factory__TuringTest.deploy()
    await TuringTest.deployTransaction.wait()

    const L1StandardBridgeAddress = await env.addressManager.getAddress(
      'Proxy__L1StandardBridge'
    )

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)
  })

  after(async () => {
    expect(await verifyStateRoots()).to.equal(true)
    console.log('Verified state roots.')
  })

  it('{tag:boba} Should transfer BOBA to L2', async () => {
    const depositBOBAAmount = utils.parseEther('10000')

    const preL1BOBABalance = await L1BOBAToken.balanceOf(env.l1Wallet.address)
    const preL2BOBABalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

    const approveL1BOBATX = await L1BOBAToken.approve(
      L1StandardBridge.address,
      depositBOBAAmount
    )
    await approveL1BOBATX.wait()

    await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        L1BOBAToken.address,
        L2BOBAToken.address,
        depositBOBAAmount,
        9999999,
        ethers.utils.formatBytes32String(new Date().getTime().toString())
      ),
      Direction.L1ToL2
    )

    const postL1BOBABalance = await L1BOBAToken.balanceOf(env.l1Wallet.address)
    const postL2BOBABalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

    expect(preL1BOBABalance).to.deep.eq(
      postL1BOBABalance.add(depositBOBAAmount)
    )

    expect(preL2BOBABalance).to.deep.eq(
      postL2BOBABalance.sub(depositBOBAAmount)
    )
  })

  it('{tag:boba} Should verify the Turing token and the ownership', async () => {
    const turingToken = await BobaTuringCredit.turingToken()
    expect(turingToken).to.be.deep.eq(L2BOBAToken.address)

    const owner = await BobaTuringCredit.owner()
    expect(owner).to.be.deep.eq(env.l2Wallet.address)
  })

  it('{tag:boba} Should not be able to update the Turing token', async () => {
    await expect(
      BobaTuringCredit.updateTuringToken(L2BOBAToken.address)
    ).to.be.revertedWith('Contract has been initialized')
  })

  it('{tag:boba} Should update the Turing price', async () => {
    const turingPrice = await BobaTuringCredit.turingPrice()
    const newTuringPrice = turingPrice.div(BigNumber.from('2'))
    const updateTx = await BobaTuringCredit.updateTuringPrice(newTuringPrice)
    await updateTx.wait()

    const updatedTuringPrice = await BobaTuringCredit.turingPrice()
    expect(updatedTuringPrice).to.be.deep.eq(newTuringPrice)

    const restoreTx = await BobaTuringCredit.updateTuringPrice(turingPrice)
    await restoreTx.wait()
  })

  it('{tag:boba} Should increase balance for a specified Turing helper contract', async () => {
    const depositAmount = utils.parseEther('100')
    const TuringHelperAddress = TuringHelper.address

    const preBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelperAddress
    )

    const approveTx = await L2BOBAToken.approve(
      BobaTuringCredit.address,
      depositAmount
    )
    await approveTx.wait()

    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositAmount,
      TuringHelperAddress
    )
    await depositTx.wait()

    const postBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelperAddress
    )

    expect(postBalance).to.be.deep.eq(preBalance.add(depositAmount))
  })

  it('{tag:boba} Should not increase balance for not Turing helper contracts', async () => {
    const depositAmount = utils.parseEther('100')

    const approveTx = await L2BOBAToken.approve(
      BobaTuringCredit.address,
      depositAmount
    )
    await approveTx.wait()

    await expect(
      BobaTuringCredit.addBalanceTo(depositAmount, L2BOBAToken.address)
    ).to.be.revertedWith('Invalid Helper Contract')
  })

  it('{tag:boba} Should return the correct credit amount', async () => {
    const prepaidBalance = await BobaTuringCredit.prepaidBalance(
      env.l2Wallet.address
    )
    const turingPrice = await BobaTuringCredit.turingPrice()
    const calculatedCredit = prepaidBalance.div(turingPrice)
    const credit = await BobaTuringCredit.getCreditAmount(env.l2Wallet.address)

    expect(calculatedCredit).to.be.deep.eq(credit)
  })

  it('{tag:boba} Should increase balance for a non-specified test contract that has the TuringTx selector', async () => {
    const depositAmount = utils.parseEther('100')
    const TuringTestAddress = TuringTest.address

    const preBalance = await BobaTuringCredit.prepaidBalance(TuringTestAddress)

    const approveTx = await L2BOBAToken.approve(
      BobaTuringCredit.address,
      depositAmount
    )
    await approveTx.wait()

    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositAmount,
      TuringTestAddress
    )
    await depositTx.wait()

    const postBalance = await BobaTuringCredit.prepaidBalance(TuringTestAddress)

    expect(postBalance).to.be.deep.eq(preBalance.add(depositAmount))
  })

  it('{tag:boba} Should not charge credit when calling the non-specified test contract', async () => {
    const TuringTestAddress = TuringTest.address

    const preBalance = await BobaTuringCredit.prepaidBalance(TuringTestAddress)

    const payloadTime = utils.formatBytes32String(
      new Date().getTime().toString()
    )
    const payloadStr = 'TEST'
    const tx = await TuringTest.TuringTx(payloadStr, payloadTime)
    await tx.wait()

    const returnStr = await TuringTest.url()
    const returnTime = await TuringTest.payload()

    const postBalance = await BobaTuringCredit.prepaidBalance(TuringTestAddress)

    expect(postBalance).to.be.deep.eq(preBalance)
    expect(returnStr).to.be.deep.eq(payloadStr)
    expect(returnTime).to.be.deep.eq(payloadTime)
  })
})
