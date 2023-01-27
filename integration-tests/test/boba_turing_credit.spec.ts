import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, BigNumber, utils, ethers, ContractFactory } from 'ethers'

import { getContractFactory } from '@eth-optimism/contracts'

import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'

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

    BobaTuringCredit = getContractFactory(
      'BobaTuringCredit',
      env.l2Wallet
    ).attach(env.addressesBOBA.BobaTuringCredit)

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

    const L1StandardBridgeAddress = await env.addressesBASE
      .Proxy__L1StandardBridge

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)
  })

  after(async () => {
    expect(await verifyStateRoots()).to.equal(true)
    console.log('Verified state roots.')
  })

  it('Should transfer BOBA to L2', async () => {
    const depositBOBAAmount = utils.parseEther('10000')

    const preL1BOBABalance = await L1BOBAToken.balanceOf(env.l1Wallet.address)
    const preL2BOBABalance = await env.l2Wallet.getBalance()

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
      )
    )

    const postL1BOBABalance = await L1BOBAToken.balanceOf(env.l1Wallet.address)
    const postL2BOBABalance = await env.l2Wallet.getBalance()

    expect(preL1BOBABalance).to.deep.eq(
      postL1BOBABalance.add(depositBOBAAmount)
    )

    expect(preL2BOBABalance).to.deep.eq(
      postL2BOBABalance.sub(depositBOBAAmount)
    )
  }).retries(3)

  it('Should verify the Turing token and the ownership', async () => {
    const turingToken = await BobaTuringCredit.turingToken()
    expect(turingToken).to.be.deep.eq(L2BOBAToken.address)

    const owner = await BobaTuringCredit.owner()
    expect(owner).to.be.deep.eq(env.l2Wallet.address)
  })

  it('Should not be able to update the Turing token', async () => {
    await expect(
      BobaTuringCredit.updateTuringToken(L2BOBAToken.address)
    ).to.be.revertedWith('Contract has been initialized')
  })

  it('Should update the Turing price', async () => {
    const turingPrice = await BobaTuringCredit.turingPrice()
    const newTuringPrice = turingPrice.div(BigNumber.from('2'))
    const updateTx = await BobaTuringCredit.updateTuringPrice(newTuringPrice)
    await updateTx.wait()

    const updatedTuringPrice = await BobaTuringCredit.turingPrice()
    expect(updatedTuringPrice).to.be.deep.eq(newTuringPrice)

    const restoreTx = await BobaTuringCredit.updateTuringPrice(turingPrice)
    await restoreTx.wait()
  }).retries(3)

  it('{tag:boba} Should increase balance for a specified Turing helper contract', async () => {
    const depositAmount = utils.parseEther('100')
    const TuringHelperAddress = TuringHelper.address

    const preBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelperAddress
    )

    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositAmount,
      TuringHelperAddress,
      { value: depositAmount }
    )
    await depositTx.wait()

    const postBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelperAddress
    )

    expect(postBalance).to.be.deep.eq(preBalance.add(depositAmount))
  })

  it('{tag:boba} Should not increase balance for not Turing helper contracts', async () => {
    const depositAmount = utils.parseEther('100')

    await expect(
      BobaTuringCredit.addBalanceTo(depositAmount, L2BOBAToken.address, {
        value: depositAmount,
      })
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

    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositAmount,
      TuringTestAddress,
      { value: depositAmount }
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

  it('{tag:boba} Should not increase balance for incorrect amount', async () => {
    const depositAmount = utils.parseEther('100')
    const TuringHelperAddress = TuringHelper.address

    await expect(
      BobaTuringCredit.addBalanceTo(
        depositAmount.sub(BigNumber.from('1')),
        TuringHelperAddress,
        { value: depositAmount }
      )
    ).to.be.revertedWith('Invalid amount')

    await expect(
      BobaTuringCredit.addBalanceTo(0, TuringHelperAddress, { value: 0 })
    ).to.be.revertedWith('Invalid amount')
  })

  it('{tag:boba} Should not increase balance for EOA accounts as helper contract address', async () => {
    const depositAmount = utils.parseEther('100')

    await expect(
      BobaTuringCredit.addBalanceTo(depositAmount, env.l2Wallet.address, {
        value: depositAmount,
      })
    ).to.be.revertedWith('Address is EOA')
  })
})
