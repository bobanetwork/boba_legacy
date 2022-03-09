import {
  BigNumber,
  Contract,
  ContractFactory,
  providers,
  Wallet,
  utils,
} from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)

import { Direction } from './shared/watcher-utils'

// import hre from 'hardhat'
// const cfg = hre.network.config

import HelloTuringJson from '@boba/turing-hybrid-compute/artifacts/contracts/HelloTuring.sol/HelloTuring.json'
import TuringHelperJson from '@boba/turing-hybrid-compute/artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

import { OptimismEnv } from './shared/env'
import { verifyStateRoots } from './shared/state-root-verification'

describe('Turing 256 Bit Random Number Test', async () => {
  let env: OptimismEnv
  let BobaTuringHelper: Contract
  let BobaTuringCredit: Contract
  let L1StandardBridge: Contract

  let L1BOBAToken: Contract
  let L2BOBAToken: Contract

  let TuringHelper: Contract
  let Factory__TuringHelper: ContractFactory

  let TuringTest: Contract
  let Factory__TuringTest: ContractFactory

  let Factory__Random: ContractFactory
  let random: Contract

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
    console.log('    Helper contract deployed at', TuringHelper.address)
    await TuringHelper.deployTransaction.wait()

    Factory__Random = new ContractFactory(
      HelloTuringJson.abi,
      HelloTuringJson.bytecode,
      env.l2Wallet
    )
    random = await Factory__Random.deploy(TuringHelper.address)
    console.log('    Test random contract deployed at', random.address)
    await random.deployTransaction.wait()

    const tr1 = await TuringHelper.addPermittedCaller(random.address)
    const res1 = await tr1.wait()
    console.log(
      '    addingPermittedCaller to TuringHelper',
      res1.events[0].data
    )

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
    const depositBOBAAmount = utils.parseEther('10')

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

  it('{tag:boba} contract should be whitelisted', async () => {
    const tr2 = await TuringHelper.checkPermittedCaller(random.address)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log(
      '    Test contract whitelisted in TuringHelper (1 = yes)?',
      result
    )
  })

  it('{tag:boba} Should register and fund your Turing helper contract in turingCredit', async () => {
    env = await OptimismEnv.new()

    const depositAmount = utils.parseEther('0.1')

    const preBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )
    console.log('    Credit Prebalance', preBalance.toString())

    const bobaBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)
    console.log('    BOBA Balance in your account', bobaBalance.toString())

    const approveTx = await L2BOBAToken.approve(
      BobaTuringCredit.address,
      depositAmount
    )
    await approveTx.wait()

    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositAmount,
      TuringHelper.address
    )
    await depositTx.wait()

    const postBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )

    expect(postBalance).to.be.deep.eq(preBalance.add(depositAmount))
  })

  it('{tag:boba} should get a 256 bit random number', async () => {
    const tr = await random.getRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = '0x' + rawData.slice(-64)
    const result = BigInt(numberHexString)
    console.log('    Turing VRF 256 =', result)
  })
})
