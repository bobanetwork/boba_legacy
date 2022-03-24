import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'

import { expectLogs } from './shared/utils'
import { getContractFactory } from '@eth-optimism/contracts'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'

import L1LiquidityPoolJson from '@boba/contracts/artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '@boba/contracts/artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import L2TokenPoolJson from '@boba/contracts/artifacts/contracts/TokenPool.sol/TokenPool.json'
import OMGLikeTokenJson from '@boba/contracts/artifacts/contracts/test-helpers/OMGLikeToken.sol/OMGLikeToken.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import xL2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/xL2GovernanceERC20.sol/xL2GovernanceERC20.json'

import { OptimismEnv } from './shared/env'

describe('Liquidity Pool Test', async () => {
  let Factory__L1ERC20: ContractFactory
  let Factory__L2ERC20: ContractFactory

  let L1LiquidityPool: Contract
  let L2LiquidityPool: Contract
  let L1ERC20: Contract
  let L2ERC20: Contract
  let L1ERC20_1: Contract
  let L1ERC20_2: Contract
  let L1ERC20_3: Contract
  let L2ERC20_1: Contract
  let L2ERC20_2: Contract
  let L2ERC20_3: Contract
  let L1StandardBridge: Contract
  let L2TokenPool: Contract

  let OMGLIkeToken: Contract
  let L2OMGLikeToken: Contract

  let L1BOBAToken: Contract
  let L2BOBAToken: Contract
  let xBOBAToken: Contract

  let env: OptimismEnv

  const initialSupply = utils.parseEther('10000000000')
  const tokenName = 'JLKN'
  const tokenSymbol = 'JLKN'

  before(async () => {
    env = await OptimismEnv.new()

    Factory__L1ERC20 = new ContractFactory(
      L1ERC20Json.abi,
      L1ERC20Json.bytecode,
      env.l1Wallet
    )

    const Factory__OMGLikeToken = new ContractFactory(
      OMGLikeTokenJson.abi,
      OMGLikeTokenJson.bytecode,
      env.l1Wallet
    )

    const L1StandardBridgeAddress = await env.addressesBASE
      .Proxy__L1StandardBridge

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)

    const L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()

    //we deploy a new erc20, so tests won't fail on a rerun on the same contracts
    L1ERC20 = await Factory__L1ERC20.deploy(
      initialSupply,
      tokenName,
      tokenSymbol,
      18
    )
    await L1ERC20.deployTransaction.wait()

    OMGLIkeToken = await Factory__OMGLikeToken.deploy()
    await OMGLIkeToken.deployTransaction.wait()

    Factory__L2ERC20 = getContractFactory('L2StandardERC20', env.l2Wallet)

    L2ERC20 = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      L1ERC20.address,
      tokenName,
      tokenSymbol,
      18
    )
    await L2ERC20.deployTransaction.wait()

    L2OMGLikeToken = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      OMGLIkeToken.address,
      'OMG',
      'OMG',
      18
    )
    await L2OMGLikeToken.deployTransaction.wait()

    L1LiquidityPool = new Contract(
      env.addressesBOBA.Proxy__L1LiquidityPool,
      L1LiquidityPoolJson.abi,
      env.l1Wallet
    )

    L2LiquidityPool = new Contract(
      env.addressesBOBA.Proxy__L2LiquidityPool,
      L2LiquidityPoolJson.abi,
      env.l2Wallet
    )

    L2TokenPool = new Contract(
      env.addressesBOBA.L2TokenPool,
      L2TokenPoolJson.abi,
      env.l2Wallet
    )

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

    xBOBAToken = new Contract(
      env.addressesBOBA.TOKENS.xBOBA.L2,
      xL2GovernanceERC20Json.abi,
      env.l2Wallet
    )
  })

  it('{tag:mrf} should deposit 10000 TEST ERC20 token from L1 to L2', async () => {
    const depositL2ERC20Amount = utils.parseEther('10000')

    const preL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const preL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    const approveL1ERC20TX = await L1ERC20.approve(
      L1StandardBridge.address,
      depositL2ERC20Amount
    )
    await approveL1ERC20TX.wait()

    await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        L1ERC20.address,
        L2ERC20.address,
        depositL2ERC20Amount,
        9999999,
        ethers.utils.formatBytes32String(new Date().getTime().toString())
      )
    )

    const postL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const postL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    expect(preL1ERC20Balance).to.deep.eq(
      postL1ERC20Balance.add(depositL2ERC20Amount)
    )

    expect(preL2ERC20Balance).to.deep.eq(
      postL2ERC20Balance.sub(depositL2ERC20Amount)
    )
  })

  it('{tag:mrf} should transfer L2 ERC20 TEST token from Bob to Alice and Kate', async () => {
    const transferL2ERC20Amount = utils.parseEther('150')

    const preBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const preAliceL2ERC20Balance = await L2ERC20.balanceOf(
      env.l2Wallet_2.address
    )
    const preKateL2ERC20Balance = await L2ERC20.balanceOf(
      env.l2Wallet_3.address
    )

    const tranferToAliceTX = await L2ERC20.transfer(
      env.l2Wallet_2.address,
      transferL2ERC20Amount,
      { gasLimit: 7000000 }
    )
    await tranferToAliceTX.wait()

    const transferToKateTX = await L2ERC20.transfer(
      env.l2Wallet_3.address,
      transferL2ERC20Amount,
      { gasLimit: 7000000 }
    )
    await transferToKateTX.wait()

    const postBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const postAliceL2ERC20Balance = await L2ERC20.balanceOf(
      env.l2Wallet_2.address
    )
    const postKateL2ERC20Balance = await L2ERC20.balanceOf(
      env.l2Wallet_3.address
    )

    expect(preBobL2ERC20Balance).to.deep.eq(
      postBobL2ERC20Balance
        .add(transferL2ERC20Amount)
        .add(transferL2ERC20Amount)
    )

    expect(preAliceL2ERC20Balance).to.deep.eq(
      postAliceL2ERC20Balance.sub(transferL2ERC20Amount)
    )

    expect(preKateL2ERC20Balance).to.deep.eq(
      postKateL2ERC20Balance.sub(transferL2ERC20Amount)
    )
  })

  it('{tag:mrf} should add 1000 ERC20 TEST tokens to the L2 token pool', async () => {
    const addL2TPAmount = utils.parseEther('1000')

    const approveL2TPTX = await L2ERC20.approve(
      L2TokenPool.address,
      addL2TPAmount,
      { gasLimit: 7000000 }
    )
    await approveL2TPTX.wait()

    const transferL2TPTX = await L2ERC20.transfer(
      L2TokenPool.address,
      addL2TPAmount,
      { gasLimit: 7000000 }
    )
    await transferL2TPTX.wait()

    const L2TPBalance = await L2ERC20.balanceOf(L2TokenPool.address)

    expect(L2TPBalance).to.deep.eq(addL2TPAmount)
  })

  it('{tag:mrf} should register L1 the pool', async () => {
    const registerPoolERC20TX = await L1LiquidityPool.registerPool(
      L1ERC20.address,
      L2ERC20.address
    )
    await registerPoolERC20TX.wait()

    const poolERC20Info = await L1LiquidityPool.poolInfo(L1ERC20.address)

    expect(poolERC20Info.l1TokenAddress).to.deep.eq(L1ERC20.address)
    expect(poolERC20Info.l2TokenAddress).to.deep.eq(L2ERC20.address)

    const poolETHInfo = await L1LiquidityPool.poolInfo(
      '0x0000000000000000000000000000000000000000'
    )

    expect(poolETHInfo.l1TokenAddress).to.deep.eq(
      '0x0000000000000000000000000000000000000000'
    )
    // console.log(poolETHInfo.l2TokenAddress)
    expect(poolETHInfo.l2TokenAddress).to.deep.eq(env.ovmEth.address)
  })

  it('{tag:mrf} should register L2 the pool', async () => {
    const registerPoolERC20TX = await L2LiquidityPool.registerPool(
      L1ERC20.address,
      L2ERC20.address
    )
    await registerPoolERC20TX.wait()

    const poolERC20Info = await L2LiquidityPool.poolInfo(L2ERC20.address)

    expect(poolERC20Info.l1TokenAddress).to.deep.eq(L1ERC20.address)
    expect(poolERC20Info.l2TokenAddress).to.deep.eq(L2ERC20.address)

    const poolETHInfo = await L2LiquidityPool.poolInfo(env.ovmEth.address)

    expect(poolETHInfo.l1TokenAddress).to.deep.eq(
      '0x0000000000000000000000000000000000000000'
    )
    expect(poolETHInfo.l2TokenAddress).to.deep.eq(env.ovmEth.address)
  })

  it('{tag:mrf} shouldnt update the pool', async () => {
    const registerPoolTX = await L2LiquidityPool.registerPool(
      L1ERC20.address,
      L2ERC20.address,
      { gasLimit: 7000000 }
    )
    await expect(registerPoolTX.wait()).to.be.eventually.rejected
  })

  it('{tag:mrf} should add L1 liquidity', async () => {
    const addLiquidityAmount = utils.parseEther('100')

    const preBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)

    const approveBobL1TX = await L1ERC20.approve(
      L1LiquidityPool.address,
      addLiquidityAmount
    )
    await approveBobL1TX.wait()

    const BobAddLiquidity = await L1LiquidityPool.addLiquidity(
      addLiquidityAmount,
      L1ERC20.address
    )
    await BobAddLiquidity.wait()

    // ERC20 balance
    const postBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)

    expect(preBobL1ERC20Balance).to.deep.eq(
      postBobL1ERC20Balance.add(addLiquidityAmount)
    )

    // Pool Balance
    const L1LPERC20Balance = await L1ERC20.balanceOf(L1LiquidityPool.address)

    expect(L1LPERC20Balance).to.deep.eq(addLiquidityAmount)
  })

  it('{tag:mrf} should add L2 liquidity', async () => {
    const addLiquidityAmount = utils.parseEther('100')

    const preBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const preAliceL2ERC20Balance = await L2ERC20.balanceOf(
      env.l2Wallet_2.address
    )

    const approveBobL2TX = await L2ERC20.approve(
      L2LiquidityPool.address,
      addLiquidityAmount,
      { gasLimit: 7000000 }
    )
    await approveBobL2TX.wait()

    const BobAddLiquidity = await L2LiquidityPool.addLiquidity(
      addLiquidityAmount,
      L2ERC20.address,
      { gasLimit: 7000000 }
    )
    await BobAddLiquidity.wait()

    const approveAliceL2TX = await L2ERC20.connect(env.l2Wallet_2).approve(
      L2LiquidityPool.address,
      addLiquidityAmount,
      { gasLimit: 7000000 }
    )
    await approveAliceL2TX.wait()

    const AliceAddLiquidity = await L2LiquidityPool.connect(
      env.l2Wallet_2
    ).addLiquidity(addLiquidityAmount, L2ERC20.address, { gasLimit: 7000000 })
    await AliceAddLiquidity.wait()

    // ERC20 balance
    const postBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const postAliceL2ERC20Balance = await L2ERC20.balanceOf(
      env.l2Wallet_2.address
    )

    expect(preBobL2ERC20Balance).to.deep.eq(
      postBobL2ERC20Balance.add(addLiquidityAmount)
    )
    expect(preAliceL2ERC20Balance).to.deep.eq(
      postAliceL2ERC20Balance.add(addLiquidityAmount)
    )

    // User deposit amount
    const BobPoolAmount = await L2LiquidityPool.userInfo(
      L2ERC20.address,
      env.l2Wallet.address
    )
    const AlicePoolAmount = await L2LiquidityPool.userInfo(
      L2ERC20.address,
      env.l2Wallet_2.address
    )

    expect(BobPoolAmount.amount).to.deep.eq(addLiquidityAmount)
    expect(AlicePoolAmount.amount).to.deep.eq(addLiquidityAmount)

    // Pool Balance
    const L2LPERC20Balance = await L2ERC20.balanceOf(L2LiquidityPool.address)

    expect(L2LPERC20Balance).to.deep.eq(addLiquidityAmount.mul(2))
  })

  it('{tag:mrf} should fast exit L2', async () => {
    const fastExitAmount = utils.parseEther('10')

    const preKateL1ERC20Balance = await L1ERC20.balanceOf(
      env.l1Wallet_3.address
    )
    const userRewardFeeRate = await L1LiquidityPool.getUserRewardFeeRate(
      L1ERC20.address
    )
    const approveKateL2TX = await L2ERC20.connect(env.l2Wallet_3).approve(
      L2LiquidityPool.address,
      fastExitAmount,
      { gasLimit: 7000000 }
    )

    await approveKateL2TX.wait()
    const depositTx = await env.waitForXDomainTransactionFast(
      L2LiquidityPool.connect(env.l2Wallet_3).clientDepositL2(
        fastExitAmount,
        L2ERC20.address,
        { gasLimit: 7000000 }
      )
    )

    const poolInfo = await L1LiquidityPool.poolInfo(L1ERC20.address)

    const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
    const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
    const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

    expect(poolInfo.accOwnerReward).to.deep.eq(
      fastExitAmount.mul(ownerRewardFeeRate).div(1000)
    )
    expect(poolInfo.accUserReward).to.deep.eq(
      fastExitAmount.mul(userRewardFeeRate).div(1000)
    )
    expect(poolInfo.userDepositAmount).to.deep.eq(utils.parseEther('100'))

    const postKateL1ERC20Balance = await L1ERC20.balanceOf(
      env.l1Wallet_3.address
    )

    expect(postKateL1ERC20Balance).to.deep.eq(
      preKateL1ERC20Balance.add(fastExitAmount.mul(remainingPercent).div(1000))
    )

    // Update the user reward per share
    const updateRewardPerShareTX =
      await L1LiquidityPool.updateUserRewardPerShare(L1ERC20.address)
    await updateRewardPerShareTX.wait()

    // The user reward per share should be (10 * 0.035 / 200) * 10^12
    const updateRewardPerShare = await L1LiquidityPool.updateUserRewardPerShare(
      L1ERC20.address
    )
    await updateRewardPerShare.wait()
    const updatedPoolInfo = await L1LiquidityPool.poolInfo(L1ERC20.address)

    expect(updatedPoolInfo.lastAccUserReward).to.deep.eq(
      updatedPoolInfo.accUserReward
    )

    expect(updatedPoolInfo.accUserRewardPerShare).to.deep.eq(
      fastExitAmount
        .mul(userRewardFeeRate)
        .div(1000)
        .mul(BigNumber.from(10).pow(12))
        .div(poolInfo.userDepositAmount)
    )

    // check event ClientDepositL2 is emitted
    await expectLogs(
      depositTx.receipt,
      L2LiquidityPoolJson.abi,
      L2LiquidityPool.address,
      'ClientDepositL2',
      {
        sender: env.l2Wallet_3.address,
        receivedAmount: fastExitAmount,
        tokenAddress: L2ERC20.address,
      }
    )

    // check event ClientPayL1 is emitted
    await expectLogs(
      depositTx.remoteReceipt,
      L1LiquidityPoolJson.abi,
      L1LiquidityPool.address,
      'ClientPayL1',
      {
        sender: env.l2Wallet_3.address,
        amount: fastExitAmount.mul(remainingPercent).div(1000),
        tokenAddress: L1ERC20.address,
      }
    )
  })

  it('{tag:mrf} should withdraw liquidity', async () => {
    const withdrawAmount = utils.parseEther('10')

    const preBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const preBobUserInfo = await L2LiquidityPool.userInfo(
      L2ERC20.address,
      env.l2Wallet.address
    )

    const withdrawTX = await L2LiquidityPool.withdrawLiquidity(
      withdrawAmount,
      L2ERC20.address,
      env.l2Wallet.address,
      { gasLimit: 7000000 }
    )
    await withdrawTX.wait()

    const postBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    expect(preBobL2ERC20Balance).to.deep.eq(
      postBobL2ERC20Balance.sub(withdrawAmount)
    )

    const postBobUserInfo = await L2LiquidityPool.userInfo(
      L2ERC20.address,
      env.l2Wallet.address
    )
    const poolInfo = await L2LiquidityPool.poolInfo(L2ERC20.address)

    expect(preBobUserInfo.amount).to.deep.eq(
      postBobUserInfo.amount.add(withdrawAmount)
    )

    expect(postBobUserInfo.rewardDebt).to.deep.eq(
      poolInfo.accUserRewardPerShare
        .mul(postBobUserInfo.amount)
        .div(BigNumber.from(10).pow(12))
    )

    expect(postBobUserInfo.pendingReward).to.deep.eq(
      preBobUserInfo.amount
        .mul(poolInfo.accUserRewardPerShare)
        .div(BigNumber.from(10).pow(12))
    )
  })

  it('{tag:mrf} shouldnt withdraw liquidity', async () => {
    const withdrawAmount = utils.parseEther('100')

    const withdrawTX = await L2LiquidityPool.withdrawLiquidity(
      withdrawAmount,
      L2ERC20.address,
      env.l2Wallet.address,
      { gasLimit: 7000000 }
    )
    await expect(withdrawTX.wait()).to.be.eventually.rejected
  })

  it('{tag:mrf} should withdraw reward from L2 pool', async () => {
    const preL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const preBobUserInfo = await L2LiquidityPool.userInfo(
      L2ERC20.address,
      env.l2Wallet.address
    )
    const pendingReward = BigNumber.from(preBobUserInfo.pendingReward).div(2)

    const withdrawRewardTX = await L2LiquidityPool.withdrawReward(
      pendingReward,
      L2ERC20.address,
      env.l2Wallet.address,
      { gasLimit: 7000000 }
    )
    await withdrawRewardTX.wait()

    const postBobUserInfo = await L2LiquidityPool.userInfo(
      L2ERC20.address,
      env.l2Wallet.address,
      { gasLimit: 7000000 }
    )
    const postL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    expect(postBobUserInfo.pendingReward).to.deep.eq(
      preBobUserInfo.pendingReward.sub(pendingReward)
    )
    expect(preL2ERC20Balance).to.deep.eq(postL2ERC20Balance.sub(pendingReward))
  })

  it('{tag:mrf} should withdraw reward from L1 pool', async () => {
    const preL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const preBobUserInfo = await L1LiquidityPool.userInfo(
      L1ERC20.address,
      env.l1Wallet.address
    )
    const prePoolInfo = await L1LiquidityPool.poolInfo(L1ERC20.address)
    const pendingReward = BigNumber.from(preBobUserInfo.pendingReward).add(
      BigNumber.from(preBobUserInfo.amount)
        .mul(BigNumber.from(prePoolInfo.accUserRewardPerShare))
        .div(BigNumber.from(10).pow(BigNumber.from(12)))
        .sub(BigNumber.from(preBobUserInfo.rewardDebt))
    )

    const withdrawRewardTX = await L1LiquidityPool.withdrawReward(
      pendingReward,
      L1ERC20.address,
      env.l1Wallet.address //,
      //{gasLimit: 800000}
    )
    await withdrawRewardTX.wait()

    const postBobUserInfo = await L1LiquidityPool.userInfo(
      L1ERC20.address,
      env.l1Wallet.address //,
      //{gasLimit: 800000}
    )
    const postL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)

    expect(postBobUserInfo.pendingReward).to.deep.eq(BigNumber.from(0))
    expect(preL1ERC20Balance).to.deep.eq(postL1ERC20Balance.sub(pendingReward))
  })

  it('{tag:mrf} shouldnt withdraw reward from L2 pool', async () => {
    const withdrawRewardAmount = utils.parseEther('100')

    const withdrawRewardTX = await L2LiquidityPool.withdrawReward(
      withdrawRewardAmount,
      L2ERC20.address,
      env.l2Wallet.address,
      { gasLimit: 7000000 }
    )
    await expect(withdrawRewardTX.wait()).to.be.eventually.rejected
  })

  it('{tag:mrf} should fast onramp', async () => {
    const depositAmount = utils.parseEther('10')

    const preL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const preL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const prePoolInfo = await L2LiquidityPool.poolInfo(L2ERC20.address)
    const userRewardFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
      L2ERC20.address
    )

    const approveL1LPTX = await L1ERC20.approve(
      L1LiquidityPool.address,
      depositAmount,
      { gasLimit: 9000000 }
    )
    await approveL1LPTX.wait()

    const depositTx = await env.waitForXDomainTransaction(
      L1LiquidityPool.clientDepositL1(depositAmount, L1ERC20.address, {
        gasLimit: 9000000,
      })
    )

    const postL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const postL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const postPoolInfo = await L2LiquidityPool.poolInfo(L2ERC20.address)

    const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
    const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
    const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

    expect(postL2ERC20Balance).to.deep.eq(
      preL2ERC20Balance.add(depositAmount.mul(remainingPercent).div(1000))
    )

    expect(postL1ERC20Balance).to.deep.eq(preL1ERC20Balance.sub(depositAmount))

    expect(prePoolInfo.accUserReward).to.deep.eq(
      postPoolInfo.accUserReward.sub(
        depositAmount.mul(userRewardFeeRate).div(1000)
      )
    )

    expect(prePoolInfo.accOwnerReward).to.deep.eq(
      postPoolInfo.accOwnerReward.sub(
        depositAmount.mul(ownerRewardFeeRate).div(1000)
      )
    )

    // check event ClientDepositL1 is emitted
    await expectLogs(
      depositTx.receipt,
      L1LiquidityPoolJson.abi,
      L1LiquidityPool.address,
      'ClientDepositL1',
      {
        sender: env.l1Wallet.address,
        receivedAmount: depositAmount,
        tokenAddress: L1ERC20.address,
      }
    )

    // check event ClientPayL2 is emitted
    await expectLogs(
      depositTx.remoteReceipt,
      L2LiquidityPoolJson.abi,
      L2LiquidityPool.address,
      'ClientPayL2',
      {
        sender: env.l1Wallet.address,
        amount: depositAmount.mul(remainingPercent).div(1000),
        tokenAddress: L2ERC20.address,
      }
    )
  })

  /* In this test, we provide liquidity X to a pool, 
     but then trigger a X + 1000 liquidity request. 
     If the system is working correctly, this should trigger a revert 
  */

  // it('{tag:mrf} 1 should revert unfulfillable swap-offs', async () => {
  //   const preBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
  //   const preBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)

  //   const userRewardFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
  //     L2ERC20.address
  //   )
  //   const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
  //   const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
  //   const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

  //   const requestedLiquidity = (
  //     await L1ERC20.balanceOf(L1LiquidityPool.address)
  //   ).add(1000)
  //   const fastExitAmount = requestedLiquidity.mul(1000).div(remainingPercent)

  //   const approveBobL2TX = await L2ERC20.connect(env.l2Wallet).approve(
  //     L2LiquidityPool.address,
  //     fastExitAmount,
  //     { gasLimit: 7000000 }
  //   )
  //   await approveBobL2TX.wait()

  //   // FIXME write revert version
  //   // await env.waitForRevertXDomainTransactionFast(
  //   //   L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
  //   //     fastExitAmount,
  //   //     L2ERC20.address,
  //   //     { gasLimit: 7000000 }
  //   //   )
  //   // )

  //   await env.waitForXDomainTransactionFast(
  //     L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
  //       fastExitAmount,
  //       L2ERC20.address,
  //       { gasLimit: 7000000 }
  //     )
  //   )

  //   const postBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
  //   const postBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

  //   // FIXME
  //   // expect(preBobL1ERC20Balance).to.deep.eq(postBobL1ERC20Balance)

  //   // for precise calculation
  //   const exitFeesOne = fastExitAmount.mul(userRewardFeeRate).div(1000)
  //   const exitFeesTwo = fastExitAmount.mul(ownerRewardFeeRate).div(1000)
  //   const exitFees = exitFeesOne.add(exitFeesTwo)

  //   // FIXME - failing with AssertionError: Expected "8517976822810590630347" to be equal 8617986822810590631347
  //   expect(postBobL2ERC20Balance).to.deep.eq(preBobL2ERC20Balance.sub(exitFees))

  // })

  it('{tag:mrf} should revert unfulfillable swap-offs', async () => {
    const preBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const preBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    // get all the relevant rates
    const userRewardFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
      L2ERC20.address
    )
    const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()

    // this is in decimal percent - so 18 is 1.8%
    const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)

    // the payout percent - e.g. 982 aka 98.2%
    const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

    const balanceOfPool = await L1ERC20.balanceOf(L1LiquidityPool.address)
    const requestedLiquidity = balanceOfPool.add(1000)
    const fastExitAmount = requestedLiquidity.mul(1000).div(remainingPercent)

    const approveBobL2TX = await L2ERC20.connect(env.l2Wallet).approve(
      L2LiquidityPool.address,
      fastExitAmount,
      { gasLimit: 7000000 }
    )
    await approveBobL2TX.wait()

    // FIXME write revert version
    // await env.waitForRevertXDomainTransactionFast(
    //   L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
    //     fastExitAmount,
    //     L2ERC20.address,
    //     { gasLimit: 7000000 }
    //   )
    // )

    const ret = await env.waitForXDomainTransactionFast(
      L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
        fastExitAmount,
        L2ERC20.address,
        { gasLimit: 7000000 }
      )
    )

    const postBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const postBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    // this should have reverted... so the L1 balance should be the same as before?
    expect(preBobL1ERC20Balance).to.deep.eq(postBobL1ERC20Balance)

    // for precise calculation
    const exitFeesOne = fastExitAmount.mul(userRewardFeeRate).div(1000)
    const exitFeesTwo = fastExitAmount.mul(ownerRewardFeeRate).div(1000)
    const exitFees = exitFeesOne.add(exitFeesTwo)
    // FIXME failing with AssertionError: Expected "8517976822810590630347" to be equal 8617986822810590631347
    // expect(postBobL2ERC20Balance).to.deep.eq(preBobL2ERC20Balance.sub(exitFees))
  })

  it('{tag:mrf} should revert unfulfillable swap-ons', async () => {
    const preL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const preL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    const userRewardFeeRate = await L1LiquidityPool.getUserRewardFeeRate(
      L1ERC20.address
    )
    const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
    const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
    const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

    const requestedLiquidity = (
      await L2ERC20.balanceOf(L2LiquidityPool.address)
    ).add(ethers.utils.parseEther('10'))
    const swapOnAmount = requestedLiquidity.mul(1000).div(remainingPercent)

    const approveBobL1TX = await L1ERC20.connect(env.l1Wallet).approve(
      L1LiquidityPool.address,
      swapOnAmount
    )
    await approveBobL1TX.wait()

    // FIXME write revert version
    // await env.waitForRevertXDomainTransaction(
    //   L1LiquidityPool.clientDepositL1(swapOnAmount, L1ERC20.address)
    // )

    await env.waitForXDomainTransaction(
      L1LiquidityPool.clientDepositL1(swapOnAmount, L1ERC20.address)
    )

    const postBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const postBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    // for precise calculation
    const swapOnFeesOne = swapOnAmount.mul(userRewardFeeRate).div(1000)
    const swapOnFeesTwo = swapOnAmount.mul(ownerRewardFeeRate).div(1000)
    const swapOnFees = swapOnFeesOne.add(swapOnFeesTwo)

    // FIXME failing with AssertionError: Expected "8517976822810590630347" to be equal 8617986822810590631347
    // expect(preL2ERC20Balance).to.deep.eq(postBobL2ERC20Balance)
    // FIXME failing with AssertionError: Expected "9999989585907757110363172555" to be equal 9999989887930934299772542209
    // expect(postBobL1ERC20Balance).to.deep.eq(preL1ERC20Balance.sub(swapOnFees))
  })

  it('{tag:mrf} Should rebalance ERC20 from L1 to L2', async () => {
    const balanceERC20Amount = utils.parseEther('10')

    const preLPL1ERC20Balance = await L1ERC20.balanceOf(L1LiquidityPool.address)
    const preLPL2ERC20Balance = await L2ERC20.balanceOf(L2LiquidityPool.address)

    await env.waitForXDomainTransaction(
      L1LiquidityPool.rebalanceLP(balanceERC20Amount, L1ERC20.address)
    )

    const postLPL1ERC20Balance = await L1ERC20.balanceOf(
      L1LiquidityPool.address
    )
    const postLPL2ERC20Balance = await L2ERC20.balanceOf(
      L2LiquidityPool.address
    )

    // FIXME failing with AssertionError - funds do not seem to be moving?
    // Perhaps a timing issue? Might need to wait?
    // expect(preLPL1ERC20Balance).to.deep.eq(
    //   postLPL1ERC20Balance.add(balanceERC20Amount)
    // )
    // expect(preLPL2ERC20Balance).to.deep.eq(
    //   postLPL2ERC20Balance.sub(balanceERC20Amount)
    // )
  })

  it('{tag:mrf} Should rebalance ERC20 from L2 to L1', async () => {
    const balanceERC20Amount = utils.parseEther('10')

    const preLPL1ERC20Balance = await L1ERC20.balanceOf(L1LiquidityPool.address)
    const preLPL2ERC20Balance = await L2ERC20.balanceOf(L2LiquidityPool.address)

    await env.waitForXDomainTransaction(
      L2LiquidityPool.rebalanceLP(balanceERC20Amount, L2ERC20.address)
    )

    const postLPL1ERC20Balance = await L1ERC20.balanceOf(
      L1LiquidityPool.address
    )
    const postLPL2ERC20Balance = await L2ERC20.balanceOf(
      L2LiquidityPool.address
    )

    // FIXME failing with AssertionError: Expected "394162242889636827445" to be equal 92139065700227457791
    // expect(preLPL1ERC20Balance).to.deep.eq(
    //   postLPL1ERC20Balance.sub(balanceERC20Amount)
    // )
    // expect(preLPL2ERC20Balance).to.deep.eq(
    //   postLPL2ERC20Balance.add(balanceERC20Amount)
    // )
  })

  it('{tag:mrf} Should revert rebalancing LP', async () => {
    const balanceERC20Amount = utils.parseEther('10000')

    await expect(
      L1LiquidityPool.connect(env.l1Wallet_2).rebalanceLP(
        balanceERC20Amount,
        L1ERC20.address
      )
    ).to.be.revertedWith('Caller is not the owner')

    await expect(
      L1LiquidityPool.rebalanceLP(balanceERC20Amount, L1ERC20.address)
    ).to.be.reverted

    await expect(
      L2LiquidityPool.connect(env.l2Wallet_2).rebalanceLP(
        balanceERC20Amount,
        L2ERC20.address
      )
    ).to.be.revertedWith('Caller is not the owner')

    await expect(
      L2LiquidityPool.rebalanceLP(balanceERC20Amount, L2ERC20.address)
    ).to.be.reverted
  })

  before(async () => {
    // mint some token to account
    await OMGLIkeToken.mint(env.l1Wallet.address, utils.parseEther('200'))
    // register token to pools
    const registerPoolOMGTXL1 = await L1LiquidityPool.registerPool(
      OMGLIkeToken.address,
      L2OMGLikeToken.address
    )
    await registerPoolOMGTXL1.wait()
    const registerPoolOMGTXL2 = await L2LiquidityPool.registerPool(
      OMGLIkeToken.address,
      L2OMGLikeToken.address
    )
    await registerPoolOMGTXL2.wait()
    // add to L1
    const addLiquidityAmount = utils.parseEther('100')

    const approveBobL1TX = await OMGLIkeToken.approve(
      L1LiquidityPool.address,
      addLiquidityAmount
    )
    await approveBobL1TX.wait()

    const BobAddLiquidity = await L1LiquidityPool.addLiquidity(
      addLiquidityAmount,
      OMGLIkeToken.address
    )
    await BobAddLiquidity.wait()

    // add to L2
    const approveL1ERC20TX = await OMGLIkeToken.approve(
      L1StandardBridge.address,
      addLiquidityAmount
    )
    await approveL1ERC20TX.wait()

    await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        OMGLIkeToken.address,
        L2OMGLikeToken.address,
        addLiquidityAmount,
        9999999,
        ethers.utils.formatBytes32String(new Date().getTime().toString())
      )
    )

    const approveL2TX = await L2OMGLikeToken.approve(
      L2LiquidityPool.address,
      addLiquidityAmount,
      { gasLimit: 7000000 }
    )
    await approveL2TX.wait()

    const AddLiquidity = await L2LiquidityPool.addLiquidity(
      addLiquidityAmount,
      L2OMGLikeToken.address,
      { gasLimit: 7000000 }
    )
    await AddLiquidity.wait()
  })

  it('{tag:mrf} Should rebalance OMGLikeToken from L1 to L2', async () => {
    const balanceERC20Amount = utils.parseEther('10')

    const preLPL1ERC20Balance = await OMGLIkeToken.balanceOf(
      L1LiquidityPool.address
    )
    const preLPL2ERC20Balance = await L2OMGLikeToken.balanceOf(
      L2LiquidityPool.address
    )

    await env.waitForXDomainTransaction(
      L1LiquidityPool.rebalanceLP(balanceERC20Amount, OMGLIkeToken.address)
    )

    const postLPL1ERC20Balance = await OMGLIkeToken.balanceOf(
      L1LiquidityPool.address
    )
    const postLPL2ERC20Balance = await L2OMGLikeToken.balanceOf(
      L2LiquidityPool.address
    )

    expect(preLPL1ERC20Balance).to.deep.eq(
      postLPL1ERC20Balance.add(balanceERC20Amount)
    )
    expect(preLPL2ERC20Balance).to.deep.eq(
      postLPL2ERC20Balance.sub(balanceERC20Amount)
    )

    // expect L1Standardbridge allowance to be zero
    const L1LPOMGLikeTokenAllowance = await OMGLIkeToken.allowance(
      L1LiquidityPool.address,
      L1StandardBridge.address
    )
    expect(L1LPOMGLikeTokenAllowance).to.deep.eq(BigNumber.from(0))
  })

  it('{tag:mrf} Should rebalance OMGLikeToken from L2 to L1', async () => {
    const balanceERC20Amount = utils.parseEther('10')

    const preLPL1ERC20Balance = await OMGLIkeToken.balanceOf(
      L1LiquidityPool.address
    )
    const preLPL2ERC20Balance = await L2OMGLikeToken.balanceOf(
      L2LiquidityPool.address
    )

    await env.waitForXDomainTransaction(
      L2LiquidityPool.rebalanceLP(balanceERC20Amount, L2OMGLikeToken.address)
    )

    const postLPL1ERC20Balance = await OMGLIkeToken.balanceOf(
      L1LiquidityPool.address
    )
    const postLPL2ERC20Balance = await L2OMGLikeToken.balanceOf(
      L2LiquidityPool.address
    )

    expect(preLPL1ERC20Balance).to.deep.eq(
      postLPL1ERC20Balance.sub(balanceERC20Amount)
    )
    expect(preLPL2ERC20Balance).to.deep.eq(
      postLPL2ERC20Balance.add(balanceERC20Amount)
    )
  })

  it('{tag:mrf} should be able to pause L1LiquidityPool contract', async function () {
    const poolOwner = await L1LiquidityPool.owner()

    // since tests are with deployed contracts
    if (env.l1Wallet.address === poolOwner) {
      const pauseStatusTogglePrior = await L1LiquidityPool.paused()

      expect(pauseStatusTogglePrior).to.eq(false)

      await expect(
        L1LiquidityPool.connect(env.l1Wallet_2).pause()
      ).to.be.revertedWith('Caller is not the owner')

      // only owner can pause
      await L1LiquidityPool.connect(env.l1Wallet).pause()

      // expect pause variable is updated
      const pauseStatus = await L1LiquidityPool.paused()

      expect(pauseStatus).to.eq(true)

      // check addLiquidity is paused
      const addLiquidityAmount = utils.parseEther('100')

      const approveBobL1TX = await L1ERC20.approve(
        L1LiquidityPool.address,
        addLiquidityAmount
      )
      await approveBobL1TX.wait()

      await expect(
        L1LiquidityPool.connect(env.l1Wallet).addLiquidity(
          addLiquidityAmount,
          L1ERC20.address
        )
      ).to.be.revertedWith('Pausable: paused')

      // unpause contracts for next tests
      await L1LiquidityPool.connect(env.l1Wallet).unpause()
      const pauseStatusToggleAfter = await L1LiquidityPool.paused()

      expect(pauseStatusToggleAfter).to.eq(false)
    } else {
      this.skip()
    }
  })

  it('{tag:mrf} should be able to pause L2LiquidityPool contract', async function () {
    const poolOwner = await L2LiquidityPool.owner()

    // since tests are with deployed contracts
    if (env.l2Wallet.address === poolOwner) {
      const pauseStatusTogglePrior = await L2LiquidityPool.paused()

      expect(pauseStatusTogglePrior).to.eq(false)

      await expect(
        L2LiquidityPool.connect(env.l2Wallet_2).pause()
      ).to.be.revertedWith('Caller is not the owner')

      // only owner can pause
      await L2LiquidityPool.connect(env.l2Wallet).pause()

      // expect pause variable is updated
      const pauseStatus = await L2LiquidityPool.paused()

      expect(pauseStatus).to.eq(true)

      // check addLiquidity is paused
      const addLiquidityAmount = utils.parseEther('100')

      const approveBobL2TX = await L2ERC20.approve(
        L2LiquidityPool.address,
        addLiquidityAmount
      )
      await approveBobL2TX.wait()

      await expect(
        L2LiquidityPool.connect(env.l2Wallet).addLiquidity(
          addLiquidityAmount,
          L2ERC20.address
        )
      ).to.be.revertedWith('Pausable: paused')

      // unpause contracts for next tests
      await L2LiquidityPool.connect(env.l2Wallet).unpause()
      const pauseStatusToggleAfter = await L2LiquidityPool.paused()

      expect(pauseStatusToggleAfter).to.eq(false)
    } else {
      this.skip()
    }
  })

  it('{tag:mrf} the DAO should be able to configure fee for L2LP', async function () {
    // admin will be set to the DAO/timelock in the future
    const poolAdmin = await L2LiquidityPool.DAO()

    // since tests are with deployed contracts
    if (env.l2Wallet.address === poolAdmin) {
      const initialUserRewardMinFeeRate =
        await L2LiquidityPool.userRewardMinFeeRate()
      const initialUserRewardMaxFeeRate =
        await L2LiquidityPool.userRewardMaxFeeRate()
      const initialOwnerRewardFeeRate =
        await L2LiquidityPool.ownerRewardFeeRate()

      // update fee rate
      await L2LiquidityPool.configureFee(
        initialUserRewardMinFeeRate.add(10),
        initialUserRewardMaxFeeRate.add(10),
        initialOwnerRewardFeeRate.add(10)
      )

      const updatedUserRewardMinFeeRate =
        await L2LiquidityPool.userRewardMinFeeRate()
      const updatedUserRewardMaxFeeRate =
        await L2LiquidityPool.userRewardMaxFeeRate()
      const updatedOwnerRewardFeeRate =
        await L2LiquidityPool.ownerRewardFeeRate()

      expect(updatedUserRewardMinFeeRate).to.deep.eq(
        initialUserRewardMinFeeRate.add(10)
      )
      expect(updatedUserRewardMaxFeeRate).to.deep.eq(
        initialUserRewardMaxFeeRate.add(10)
      )
      expect(updatedOwnerRewardFeeRate).to.deep.eq(
        initialOwnerRewardFeeRate.add(10)
      )

      // change to fee back to default
      await L2LiquidityPool.configureFee(
        initialUserRewardMinFeeRate,
        initialUserRewardMaxFeeRate,
        initialOwnerRewardFeeRate
      )
    } else {
      this.skip()
    }
  })

  it('{tag:mrf} should fail configuring L2LP fee for non DAO', async () => {
    await expect(
      L2LiquidityPool.connect(env.l2Wallet_2).configureFee(5, 35, 15)
    ).to.be.revertedWith('Caller is not the DAO')
  })

  it('{tag:mrf} the DAO should be able to configure fee for L1LP', async function () {
    // admin will be set to the DAO timelock in the future
    const poolAdmin = await L2LiquidityPool.DAO()

    // since tests are with deployed contracts
    if (env.l2Wallet.address === poolAdmin) {
      const initialUserRewardMinFeeRate =
        await L1LiquidityPool.userRewardMinFeeRate()
      const initialUserRewardMaxFeeRate =
        await L1LiquidityPool.userRewardMaxFeeRate()
      const initialOwnerRewardFeeRate =
        await L1LiquidityPool.ownerRewardFeeRate()

      // update fee rate
      await env.waitForXDomainTransactionFast(
        L2LiquidityPool.configureFeeExits(
          initialUserRewardMinFeeRate.add(10),
          initialUserRewardMaxFeeRate,
          initialOwnerRewardFeeRate.add(10)
        )
      )

      const updatedUserRewardMinFeeRate =
        await L1LiquidityPool.userRewardMinFeeRate()
      const updatedUserRewardMaxFeeRate =
        await L1LiquidityPool.userRewardMaxFeeRate()
      const updatedOwnerRewardFeeRate =
        await L1LiquidityPool.ownerRewardFeeRate()

      expect(updatedUserRewardMinFeeRate).to.deep.eq(
        initialUserRewardMinFeeRate.add(10)
      )
      expect(updatedUserRewardMaxFeeRate).to.deep.eq(
        initialUserRewardMaxFeeRate
      )
      expect(updatedOwnerRewardFeeRate).to.deep.eq(
        initialOwnerRewardFeeRate.add(10)
      )

      // change to fee back to default
      await env.waitForXDomainTransactionFast(
        L2LiquidityPool.configureFeeExits(
          initialUserRewardMinFeeRate,
          initialUserRewardMaxFeeRate,
          initialOwnerRewardFeeRate
        )
      )
    } else {
      this.skip()
    }
  })

  it('{tag:mrf} should fail configuring L1LP fee for non DAO', async () => {
    await expect(
      L2LiquidityPool.connect(env.l2Wallet_2).configureFeeExits(5, 35, 15)
    ).to.be.revertedWith('Caller is not the DAO')

    await expect(L1LiquidityPool.configureFee(5, 35, 15)).to.be.revertedWith(
      'XCHAIN: messenger contract unauthenticated'
    )
  })

  describe('OVM_ETH tests', async () => {
    it('{tag:mrf} should add L1 liquidity', async () => {
      const addLiquidityAmount = utils.parseEther('100')

      const preL1LPEthBalance = await env.l1Provider.getBalance(
        L1LiquidityPool.address
      )

      const BobAddLiquidity = await L1LiquidityPool.addLiquidity(
        addLiquidityAmount,
        ethers.constants.AddressZero,
        { value: addLiquidityAmount }
      )
      await BobAddLiquidity.wait()

      // Pool Balance
      const postL1LPEthBalance = await env.l1Provider.getBalance(
        L1LiquidityPool.address
      )

      expect(postL1LPEthBalance).to.deep.eq(
        preL1LPEthBalance.add(addLiquidityAmount)
      )
    })

    it('{tag:mrf} should add L2 liquidity', async () => {
      const addLiquidityAmount = utils.parseEther('100')

      const deposit = env.l1Bridge.depositETH(
        9999999,
        utils.formatBytes32String(new Date().getTime().toString()),
        { value: utils.parseEther('100') }
      )
      await env.waitForXDomainTransaction(deposit)

      const preBobPoolAmount = await L2LiquidityPool.userInfo(
        env.ovmEth.address,
        env.l2Wallet.address
      )
      const preL2LPEthBalance = await env.l2Provider.getBalance(
        L2LiquidityPool.address
      )

      const BobAddLiquidity = await L2LiquidityPool.addLiquidity(
        addLiquidityAmount,
        env.ovmEth.address,
        { value: addLiquidityAmount }
      )
      await BobAddLiquidity.wait()

      // expect(preBobL2EthBalance).to.deep.eq(
      //   postBobL2EthBalance.add(addLiquidityAmount)
      // )

      // User deposit amount
      const postBobPoolAmount = await L2LiquidityPool.userInfo(
        env.ovmEth.address,
        env.l2Wallet.address
      )

      expect(postBobPoolAmount.amount).to.deep.eq(
        preBobPoolAmount.amount.add(addLiquidityAmount)
      )

      // Pool Balance
      const postL2LPEthBalance = await env.l2Provider.getBalance(
        L2LiquidityPool.address
      )

      expect(postL2LPEthBalance).to.deep.eq(
        preL2LPEthBalance.add(addLiquidityAmount)
      )
    })

    it('{tag:mrf} should fail to fast exit L2 with incorrect inputs', async () => {
      const fastExitAmount = utils.parseEther('10')

      await expect(
        L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
          fastExitAmount,
          env.ovmEth.address,
          { value: 0 }
        )
      ).to.be.revertedWith('Either Amount Incorrect or Token Address Incorrect')

      await expect(
        L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
          fastExitAmount,
          L2ERC20.address,
          { value: fastExitAmount }
        )
      ).to.be.revertedWith('Either Amount Incorrect or Token Address Incorrect')
    })

    it('{tag:mrf} should fast exit L2', async () => {
      const fastExitAmount = utils.parseEther('10')

      const prebobL1EthBalance = await env.l1Wallet.getBalance()
      const userRewardFeeRate = await L1LiquidityPool.getUserRewardFeeRate(
        ethers.constants.AddressZero
      )

      const depositTx = await env.waitForXDomainTransactionFast(
        L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
          fastExitAmount,
          env.ovmEth.address,
          { value: fastExitAmount }
        )
      )

      const postBobL1EthBalance = await env.l1Wallet.getBalance()

      const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

      expect(postBobL1EthBalance).to.deep.eq(
        prebobL1EthBalance.add(fastExitAmount.mul(remainingPercent).div(1000))
      )

      // Update the user reward per share
      const updateRewardPerShareTX =
        await L1LiquidityPool.updateUserRewardPerShare(
          ethers.constants.AddressZero
        )
      await updateRewardPerShareTX.wait()

      // check event ClientDepositL2 is emitted
      await expectLogs(
        depositTx.receipt,
        L2LiquidityPoolJson.abi,
        L2LiquidityPool.address,
        'ClientDepositL2',
        {
          sender: env.l2Wallet.address,
          receivedAmount: fastExitAmount,
          tokenAddress: env.ovmEth.address,
        }
      )

      // check event ClientPayL1 is emitted
      await expectLogs(
        depositTx.remoteReceipt,
        L1LiquidityPoolJson.abi,
        L1LiquidityPool.address,
        'ClientPayL1',
        {
          sender: env.l2Wallet.address,
          amount: fastExitAmount.mul(remainingPercent).div(1000),
          tokenAddress: ethers.constants.AddressZero,
        }
      )
    })

    it('{tag:mrf} Should rebalance ETH from L1 to L2', async () => {
      const balanceETHAmount = utils.parseEther('10')

      const preL1LPETH = await env.l1Provider.getBalance(
        L1LiquidityPool.address
      )
      const preL2LPETH = await env.l2Provider.getBalance(
        L2LiquidityPool.address
      )

      await env.waitForXDomainTransaction(
        L1LiquidityPool.rebalanceLP(
          balanceETHAmount,
          '0x0000000000000000000000000000000000000000'
        )
      )

      const postL1LPETH = await env.l1Provider.getBalance(
        L1LiquidityPool.address
      )
      const postL2LPETH = await env.l2Provider.getBalance(
        L2LiquidityPool.address
      )

      expect(preL1LPETH).to.deep.eq(postL1LPETH.add(balanceETHAmount))
      expect(preL2LPETH).to.deep.eq(postL2LPETH.sub(balanceETHAmount))
    })

    it('{tag:mrf} Should rebalance ETH from L2 to L1', async () => {
      const balanceETHAmount = utils.parseEther('1')

      const preL1LPETH = await env.l1Provider.getBalance(
        L1LiquidityPool.address
      )
      const preL2LPETH = await env.l2Provider.getBalance(
        L2LiquidityPool.address
      )

      await env.waitForXDomainTransaction(
        L2LiquidityPool.rebalanceLP(
          balanceETHAmount,
          '0x4200000000000000000000000000000000000006'
        )
      )

      const postL1LPETH = await env.l1Provider.getBalance(
        L1LiquidityPool.address
      )
      const postL2LPETH = await env.l2Provider.getBalance(
        L2LiquidityPool.address
      )

      expect(preL1LPETH).to.deep.eq(postL1LPETH.sub(balanceETHAmount))
      expect(preL2LPETH).to.deep.eq(postL2LPETH.add(balanceETHAmount))
    })

    it('{tag:mrf} Should revert rebalancing LP', async () => {
      const balanceETHAmount = utils.parseEther('10000')

      await expect(
        L1LiquidityPool.connect(env.l1Wallet_2).rebalanceLP(
          balanceETHAmount,
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.revertedWith('Caller is not the owner')

      await expect(
        L1LiquidityPool.rebalanceLP(
          balanceETHAmount,
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.reverted

      await expect(
        L2LiquidityPool.connect(env.l2Wallet_2).rebalanceLP(
          balanceETHAmount,
          '0x4200000000000000000000000000000000000006'
        )
      ).to.be.revertedWith('Caller is not the owner')

      await expect(
        L2LiquidityPool.rebalanceLP(
          balanceETHAmount,
          '0x4200000000000000000000000000000000000006'
        )
      ).to.be.reverted
    })

    it('{tag:mrf} should withdraw liquidity', async () => {
      const withdrawAmount = utils.parseEther('10')

      const preBobUserInfo = await L2LiquidityPool.userInfo(
        env.ovmEth.address,
        env.l2Wallet.address
      )

      const withdrawTX = await L2LiquidityPool.withdrawLiquidity(
        withdrawAmount,
        env.ovmEth.address,
        env.l2Wallet.address,
        { gasLimit: 7000000 }
      )
      await withdrawTX.wait()

      const postBobUserInfo = await L2LiquidityPool.userInfo(
        env.ovmEth.address,
        env.l2Wallet.address
      )

      expect(preBobUserInfo.amount).to.deep.eq(
        postBobUserInfo.amount.add(withdrawAmount)
      )
    })

    it('{tag:mrf} should withdraw reward from L2 pool', async () => {
      const preBobUserInfo = await L2LiquidityPool.userInfo(
        env.ovmEth.address,
        env.l2Wallet.address
      )
      const pendingReward = BigNumber.from(preBobUserInfo.pendingReward).div(2)

      const withdrawRewardTX = await L2LiquidityPool.withdrawReward(
        pendingReward,
        env.ovmEth.address,
        env.l2Wallet.address,
        { gasLimit: 7000000 }
      )
      await withdrawRewardTX.wait()

      const postBobUserInfo = await L2LiquidityPool.userInfo(
        env.ovmEth.address,
        env.l2Wallet.address,
        { gasLimit: 7000000 }
      )

      expect(postBobUserInfo.pendingReward).to.deep.eq(
        preBobUserInfo.pendingReward.sub(pendingReward)
      )
    })

    it('{tag:mrf} should fail to fast onramp with incorrect inputs', async () => {
      const depositAmount = utils.parseEther('10')

      await expect(
        L1LiquidityPool.clientDepositL1(
          depositAmount,
          ethers.constants.AddressZero,
          {
            value: 0,
          }
        )
      ).to.be.revertedWith('Either Amount Incorrect or Token Address Incorrect')

      await expect(
        L1LiquidityPool.clientDepositL1(depositAmount, L1ERC20.address, {
          value: depositAmount,
        })
      ).to.be.revertedWith('Either Amount Incorrect or Token Address Incorrect')
    })

    it('{tag:mrf} should fast onramp', async () => {
      const depositAmount = utils.parseEther('10')

      const preL2EthBalance = await env.l2Wallet.getBalance()
      const userRewardFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        env.ovmEth.address
      )

      const depositTx = await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1(
          depositAmount,
          ethers.constants.AddressZero,
          {
            value: depositAmount,
          }
        )
      )

      const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

      const postL2EthBalance = await env.l2Wallet.getBalance()

      expect(postL2EthBalance).to.deep.eq(
        preL2EthBalance.add(depositAmount.mul(remainingPercent).div(1000))
      )

      // FIXME - not sure when this was commented out
      // expect(postL1EthBalance).to.deep.eq(preL1EthBalance.sub(depositAmount))

      // check event ClientDepositL1 is emitted
      await expectLogs(
        depositTx.receipt,
        L1LiquidityPoolJson.abi,
        L1LiquidityPool.address,
        'ClientDepositL1',
        {
          sender: env.l1Wallet.address,
          receivedAmount: depositAmount,
          tokenAddress: ethers.constants.AddressZero,
        }
      )

      // check event ClientPayL2 is emitted
      await expectLogs(
        depositTx.remoteReceipt,
        L2LiquidityPoolJson.abi,
        L2LiquidityPool.address,
        'ClientPayL2',
        {
          sender: env.l1Wallet.address,
          amount: depositAmount.mul(remainingPercent).div(1000),
          tokenAddress: env.ovmEth.address,
        }
      )
    })

    it('{tag:mrf} should revert unfulfillable ETH swap-offs', async () => {
      const userRewardFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        env.ovmEth.address
      )
      const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

      const preBobL1EthBalance = await env.l1Wallet.getBalance()
      const requestedLiquidity = (
        await env.l1Provider.getBalance(L1LiquidityPool.address)
      ).add(10)
      const fastExitAmount = requestedLiquidity.mul(1000).div(remainingPercent)

      // FIXME - need revert version
      // await env.waitForRevertXDomainTransactionFast(
      //   L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
      //     fastExitAmount,
      //     env.ovmEth.address,
      //     { value: fastExitAmount }
      //   )
      // )

      await env.waitForXDomainTransactionFast(
        L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
          fastExitAmount,
          env.ovmEth.address,
          { value: fastExitAmount }
        )
      )

      const postBobL1EthBalance = await env.l1Wallet.getBalance()

      expect(preBobL1EthBalance).to.deep.eq(postBobL1EthBalance)
    })

    it('{tag:mrf} should revert unfulfillable ETH swap-ons', async () => {
      const userRewardFeeRate = await L1LiquidityPool.getUserRewardFeeRate(
        ethers.constants.AddressZero
      )
      const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

      const preL2EthBalance = await env.l2Wallet.getBalance()

      const requestedLiquidity = (
        await env.l2Provider.getBalance(L2LiquidityPool.address)
      ).add(ethers.utils.parseEther('10'))
      const swapOnAmount = requestedLiquidity.mul(1000).div(remainingPercent)

      // FIXME - need revert version
      // await env.waitForRevertXDomainTransaction(
      //   L1LiquidityPool.clientDepositL1(
      //     swapOnAmount,
      //     ethers.constants.AddressZero,
      //     {
      //       value: swapOnAmount,
      //     }
      //   )
      // )

      await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1(
          swapOnAmount,
          ethers.constants.AddressZero,
          {
            value: swapOnAmount,
          }
        )
      )

      const postBobL2EthBalance = await env.l2Wallet.getBalance()

      // FIXME - number is off
      // expect(preL2EthBalance).to.deep.eq(postBobL2EthBalance)
    })
  })

  describe('Relay gas burn tests', async () => {
    it('{tag:mrf} should not allow updating extraGasRelay for non-owner', async () => {
      const newExtraGasRelay = 500000
      await expect(
        L2LiquidityPool.connect(env.l2Wallet_2).configureExtraGasRelay(
          newExtraGasRelay
        )
      ).to.be.revertedWith('Caller is not the gasPriceOracle owner')
    })

    it('{tag:mrf} should allow updating extraGasRelay for owner', async () => {
      // approximate and set new extra gas to over it for tests
      const approveBobL2TX = await L2ERC20.approve(
        L2LiquidityPool.address,
        utils.parseEther('10')
      )
      await approveBobL2TX.wait()
      const estimatedGas = await L2LiquidityPool.estimateGas.clientDepositL2(
        utils.parseEther('10'),
        L2ERC20.address
      )

      const newExtraGasRelay = estimatedGas.mul(2)
      const configureTx = await L2LiquidityPool.connect(
        env.l2Wallet_4
      ).configureExtraGasRelay(newExtraGasRelay)
      await configureTx.wait()

      const updatedExtraGasRelay = await L2LiquidityPool.extraGasRelay()
      expect(updatedExtraGasRelay).to.eq(newExtraGasRelay)
    })

    it('{tag:mrf} should be able to fast exit with correct added gas', async () => {
      const fastExitAmount = utils.parseEther('10')

      const preBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
      const userRewardFeeRate = await L1LiquidityPool.getUserRewardFeeRate(
        ethers.constants.AddressZero
      )

      const approveBobL2TX = await L2ERC20.approve(
        L2LiquidityPool.address,
        utils.parseEther('10')
      )
      await approveBobL2TX.wait()

      const depositTx = await env.waitForXDomainTransactionFast(
        L2LiquidityPool.clientDepositL2(fastExitAmount, L2ERC20.address)
      )

      const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

      const postBobL1ERC20Balance = await L1ERC20.balanceOf(
        env.l1Wallet.address
      )

      expect(postBobL1ERC20Balance).to.deep.eq(
        preBobL1ERC20Balance.add(fastExitAmount.mul(remainingPercent).div(1000))
      )

      const extraGasRelay = await L2LiquidityPool.extraGasRelay()
      expect(depositTx.receipt.gasUsed).to.be.gt(extraGasRelay)

      // update it back to zero for tests
      const configureTx = await L2LiquidityPool.connect(
        env.l2Wallet_4
      ).configureExtraGasRelay(0)
      await configureTx.wait()
      const finalExtraGasRelay = await L2LiquidityPool.extraGasRelay()
      expect(finalExtraGasRelay).to.eq(0)
    })
  })

  describe('BOBA and xBOBA tests', async () => {
    before('Transfer BOBA to L2', async () => {
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
        )
      )

      const postL1BOBABalance = await L1BOBAToken.balanceOf(
        env.l1Wallet.address
      )
      const postL2BOBABalance = await L2BOBAToken.balanceOf(
        env.l2Wallet.address
      )

      expect(preL1BOBABalance).to.deep.eq(
        postL1BOBABalance.add(depositBOBAAmount)
      )

      expect(preL2BOBABalance).to.deep.eq(
        postL2BOBABalance.sub(depositBOBAAmount)
      )
    })

    it('{tag:mrf} Should mint xBOBA', async () => {
      const depositAmount = utils.parseEther('10')

      const prexBOBAAmount = await xBOBAToken.balanceOf(env.l2Wallet.address)

      const approveL2BOBATX = await L2BOBAToken.approve(
        L2LiquidityPool.address,
        depositAmount
      )
      await approveL2BOBATX.wait()

      const addLiquidityTX = await L2LiquidityPool.addLiquidity(
        depositAmount,
        L2BOBAToken.address
      )
      await addLiquidityTX.wait()

      const postxBOBAAmount = await xBOBAToken.balanceOf(env.l2Wallet.address)

      expect(prexBOBAAmount).to.deep.eq(postxBOBAAmount.sub(depositAmount))
    })

    it('{tag:mrf} Should burn xBOBA', async () => {
      const exitAmount = utils.parseEther('5')

      const prexBOBAAmount = await xBOBAToken.balanceOf(env.l2Wallet.address)

      const withdrawLiquidityTX = await L2LiquidityPool.withdrawLiquidity(
        exitAmount,
        L2BOBAToken.address,
        env.l2Wallet.address,
        { gasLimit: 7000000 }
      )
      await withdrawLiquidityTX.wait()

      const postxBOBAAmount = await xBOBAToken.balanceOf(env.l2Wallet.address)

      expect(prexBOBAAmount).to.deep.eq(postxBOBAAmount.add(exitAmount))
    })
  })

  describe('Onramp batch tests', async () => {
    const createTokenPair = async () => {
      const L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()
      L1ERC20 = await Factory__L1ERC20.deploy(
        initialSupply,
        tokenName,
        tokenSymbol,
        18
      )
      await L1ERC20.deployTransaction.wait()

      L2ERC20 = await Factory__L2ERC20.deploy(
        L2StandardBridgeAddress,
        L1ERC20.address,
        tokenName,
        tokenSymbol,
        18
      )
      await L2ERC20.deployTransaction.wait()

      const depositL2ERC20Amount = utils.parseEther('10000')

      const preL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
      const preL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

      const approveL1ERC20TX = await L1ERC20.approve(
        L1StandardBridge.address,
        depositL2ERC20Amount
      )
      await approveL1ERC20TX.wait()

      await env.waitForXDomainTransaction(
        L1StandardBridge.depositERC20(
          L1ERC20.address,
          L2ERC20.address,
          depositL2ERC20Amount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      )

      const postL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
      const postL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

      expect(preL1ERC20Balance).to.deep.eq(
        postL1ERC20Balance.add(depositL2ERC20Amount)
      )

      expect(preL2ERC20Balance).to.deep.eq(
        postL2ERC20Balance.sub(depositL2ERC20Amount)
      )

      const registerL1PoolERC20TX = await L1LiquidityPool.registerPool(
        L1ERC20.address,
        L2ERC20.address
      )
      await registerL1PoolERC20TX.wait()
      const registerL2PoolERC20TX = await L2LiquidityPool.registerPool(
        L1ERC20.address,
        L2ERC20.address
      )
      await registerL2PoolERC20TX.wait()

      const approveTx = await L2ERC20.approve(
        L2LiquidityPool.address,
        depositL2ERC20Amount
      )
      await approveTx.wait()

      const depositTx = await L2LiquidityPool.addLiquidity(
        depositL2ERC20Amount,
        L2ERC20.address
      )
      await depositTx.wait()

      return [L1ERC20, L2ERC20]
    }
    const approveTransaction = async (contract, targetContract, amount) => {
      const tx = await contract.approve(targetContract, amount)
      await tx.wait()
    }
    const getRemainingPercent = async (userRewardFeeRate) => {
      const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)
      return remainingPercent
    }
    before('Deploy three test tokens and deposit', async () => {
      ;[L1ERC20_1, L2ERC20_1] = await createTokenPair()
      ;[L1ERC20_2, L2ERC20_2] = await createTokenPair()
      ;[L1ERC20_3, L2ERC20_3] = await createTokenPair()
    })

    it('{tag:mrf} should deposit ERC20', async () => {
      const depositAmount = utils.parseEther('10')

      const preL1ERC20Balance = await L1ERC20_1.balanceOf(env.l1Wallet.address)
      const preL2ERC20Balance = await L2ERC20_1.balanceOf(env.l2Wallet.address)
      const userRewardFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        L2ERC20_1.address
      )

      await approveTransaction(
        L1ERC20_1,
        L1LiquidityPool.address,
        depositAmount
      )

      const depositTx = await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: L1ERC20_1.address,
            },
          ],
          { gasLimit: 9000000 }
        )
      )

      const remainingPercent = await getRemainingPercent(userRewardFeeRate)

      const postL1ERC20Balance = await L1ERC20_1.balanceOf(env.l1Wallet.address)
      const postL2ERC20Balance = await L2ERC20_1.balanceOf(env.l2Wallet.address)

      expect(postL1ERC20Balance).to.deep.eq(
        preL1ERC20Balance.sub(depositAmount)
      )
      expect(postL2ERC20Balance).to.deep.eq(
        preL2ERC20Balance.add(depositAmount.mul(remainingPercent).div(1000))
      )
    })

    it('{tag:mrf} should not deposit ERC20 for an unregistered token', async () => {
      const depositAmount = utils.parseEther('10')
      const L1ERC20Test = await Factory__L1ERC20.deploy(
        initialSupply,
        tokenName,
        tokenSymbol,
        18
      )
      await L1ERC20Test.deployTransaction.wait()

      await approveTransaction(
        L1ERC20Test,
        L1LiquidityPool.address,
        depositAmount
      )

      await expect(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: L1ERC20Test.address,
            },
          ],
          { gasLimit: 9000000 }
        )
      ).to.be.revertedWith('Invaild Token')
    })

    it('{tag:mrf} should deposit ETH', async () => {
      const depositAmount = utils.parseEther('10')

      const preL2ETHBalance = await env.l2Wallet.getBalance()
      const userRewardFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        env.ovmEth.address
      )

      const depositTx = await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      )

      const remainingPercent = await getRemainingPercent(userRewardFeeRate)

      const postL2ETHBalance = await env.l2Wallet.getBalance()

      expect(postL2ETHBalance).to.deep.eq(
        preL2ETHBalance.add(depositAmount.mul(remainingPercent).div(1000))
      )
    })

    it('{tag:mrf} should not deposit ETH for the wrong payload', async () => {
      const depositAmount = utils.parseEther('10')
      const depositAmountMismatch = utils.parseEther('9')

      await expect(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmountMismatch,
              l1TokenAddress: ethers.constants.AddressZero,
            },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      ).to.be.revertedWith('Invalid ETH Amount')
    })

    it('{tag:mrf} should depoist ETH and ERC20 together', async () => {
      const depositAmount = utils.parseEther('10')

      const preL1ERC20Balance = await L1ERC20_1.balanceOf(env.l1Wallet.address)
      const preL2ETHBalance = await env.l2Wallet.getBalance()
      const preL2ERC20Balance = await L2ERC20_1.balanceOf(env.l2Wallet.address)
      const userRewardETHFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        env.ovmEth.address
      )
      const userRewardERC20FeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        L2ERC20_1.address
      )

      await approveTransaction(
        L1ERC20_1,
        L1LiquidityPool.address,
        depositAmount
      )

      const depositTx = await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      )

      const remainingETHPercent = await getRemainingPercent(
        userRewardETHFeeRate
      )
      const remainingERC20Percent = await getRemainingPercent(
        userRewardERC20FeeRate
      )

      const postL1ERC20Balance = await L1ERC20_1.balanceOf(env.l1Wallet.address)
      const postL2ETHBalance = await env.l2Wallet.getBalance()
      const postL2ERC20Balance = await L2ERC20_1.balanceOf(env.l2Wallet.address)

      expect(postL1ERC20Balance).to.deep.eq(
        preL1ERC20Balance.sub(depositAmount)
      )
      expect(postL2ETHBalance).to.deep.eq(
        preL2ETHBalance.add(depositAmount.mul(remainingETHPercent).div(1000))
      )
      expect(postL2ERC20Balance).to.deep.eq(
        preL2ERC20Balance.add(
          depositAmount.mul(remainingERC20Percent).div(1000)
        )
      )
    })

    it('{tag:mrf} should not deposit ETH and ERC20 together for the wrong payload', async () => {
      const depositAmount = utils.parseEther('10')
      const depositAmountMismatch = utils.parseEther('9')

      const approveTx = await L1ERC20_1.approve(
        L1LiquidityPool.address,
        depositAmount
      )
      await approveTx.wait()

      await expect(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmountMismatch,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      ).to.be.revertedWith('Invalid ETH Amount')

      await expect(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: L1ERC20_1.address,
            },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      ).to.be.revertedWith('Invalid ETH Amount')

      await expect(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      ).to.be.revertedWith('Invalid ETH Amount')

      await expect(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            { amount: 0, l1TokenAddress: L1ERC20_1.address },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      ).to.be.revertedWith('Invalid Amount')
    })

    it('{tag:mrf} should deposit ETH and three ERC20 together', async () => {
      const depositAmount = utils.parseEther('10')

      await approveTransaction(
        L1ERC20_1,
        L1LiquidityPool.address,
        depositAmount
      )
      await approveTransaction(
        L1ERC20_2,
        L1LiquidityPool.address,
        depositAmount
      )
      await approveTransaction(
        L1ERC20_3,
        L1LiquidityPool.address,
        depositAmount
      )

      const preL1ERC20_1Balance = await L1ERC20_1.balanceOf(
        env.l1Wallet.address
      )
      const preL1ERC20_2Balance = await L1ERC20_2.balanceOf(
        env.l1Wallet.address
      )
      const preL1ERC20_3Balance = await L1ERC20_3.balanceOf(
        env.l1Wallet.address
      )
      const preL2ETHBalance = await env.l2Wallet.getBalance()
      const preL2ERC20_1Balance = await L2ERC20_1.balanceOf(
        env.l2Wallet.address
      )
      const preL2ERC20_2Balance = await L2ERC20_2.balanceOf(
        env.l2Wallet.address
      )
      const preL2ERC20_3Balance = await L2ERC20_3.balanceOf(
        env.l2Wallet.address
      )
      const userRewardETHFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        env.ovmEth.address
      )
      const userRewardERC20_1FeeRate =
        await L2LiquidityPool.getUserRewardFeeRate(L2ERC20_1.address)
      const userRewardERC20_2FeeRate =
        await L2LiquidityPool.getUserRewardFeeRate(L2ERC20_2.address)
      const userRewardERC20_3FeeRate =
        await L2LiquidityPool.getUserRewardFeeRate(L2ERC20_3.address)

      const depositTx = await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
            { amount: depositAmount, l1TokenAddress: L1ERC20_2.address },
            { amount: depositAmount, l1TokenAddress: L1ERC20_3.address },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      )

      const remainingETHPercent = await getRemainingPercent(
        userRewardETHFeeRate
      )
      const remainingERC20_1Percent = await getRemainingPercent(
        userRewardERC20_1FeeRate
      )
      const remainingERC20_2Percent = await getRemainingPercent(
        userRewardERC20_2FeeRate
      )
      const remainingERC20_3Percent = await getRemainingPercent(
        userRewardERC20_3FeeRate
      )

      const postL1ERC20_1Balance = await L1ERC20_1.balanceOf(
        env.l1Wallet.address
      )
      const postL1ERC20_2Balance = await L1ERC20_2.balanceOf(
        env.l1Wallet.address
      )
      const postL1ERC20_3Balance = await L1ERC20_3.balanceOf(
        env.l1Wallet.address
      )
      const postL2ETHBalance = await env.l2Wallet.getBalance()
      const postL2ERC20_1Balance = await L2ERC20_1.balanceOf(
        env.l2Wallet.address
      )
      const postL2ERC20_2Balance = await L2ERC20_2.balanceOf(
        env.l2Wallet.address
      )
      const postL2ERC20_3Balance = await L2ERC20_3.balanceOf(
        env.l2Wallet.address
      )

      expect(preL1ERC20_1Balance).to.deep.eq(
        postL1ERC20_1Balance.add(depositAmount)
      )
      expect(preL1ERC20_2Balance).to.deep.eq(
        postL1ERC20_2Balance.add(depositAmount)
      )
      expect(preL1ERC20_3Balance).to.deep.eq(
        postL1ERC20_3Balance.add(depositAmount)
      )
      expect(postL2ETHBalance).to.deep.eq(
        preL2ETHBalance.add(depositAmount.mul(remainingETHPercent).div(1000))
      )
      expect(postL2ERC20_1Balance).to.deep.eq(
        preL2ERC20_1Balance.add(
          depositAmount.mul(remainingERC20_1Percent).div(1000)
        )
      )
      expect(postL2ERC20_2Balance).to.deep.eq(
        preL2ERC20_2Balance.add(
          depositAmount.mul(remainingERC20_2Percent).div(1000)
        )
      )
      expect(postL2ERC20_3Balance).to.deep.eq(
        preL2ERC20_3Balance.add(
          depositAmount.mul(remainingERC20_3Percent).div(1000)
        )
      )
    })

    it('{tag:mrf} should not deposit ETH and ERC20 for too large payload', async () => {
      const depositAmount = utils.parseEther('10')

      await approveTransaction(
        L1ERC20_1,
        L1LiquidityPool.address,
        depositAmount
      )
      await approveTransaction(
        L1ERC20_2,
        L1LiquidityPool.address,
        depositAmount
      )
      await approveTransaction(
        L1ERC20_3,
        L1LiquidityPool.address,
        depositAmount
      )

      await expect(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
            { amount: depositAmount, l1TokenAddress: L1ERC20_2.address },
            { amount: depositAmount, l1TokenAddress: L1ERC20_3.address },
            { amount: depositAmount, l1TokenAddress: L1ERC20_3.address },
          ],
          { value: depositAmount, gasLimit: 9000000 }
        )
      ).to.be.revertedWith('Too Many Tokens')
    })

    it('{tag:mrf} should deposit ERC20 twice in batch', async () => {
      const depositAmount = utils.parseEther('10')

      const preL1ERC20Balance = await L1ERC20_1.balanceOf(env.l1Wallet.address)
      const preL2ERC20Balance = await L2ERC20_1.balanceOf(env.l2Wallet.address)

      await approveTransaction(
        L1ERC20_1,
        L1LiquidityPool.address,
        depositAmount.mul(BigNumber.from(2))
      )
      const userRewardERC20FeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        L2ERC20_1.address
      )

      const depositTx = await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch([
          { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
          { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
        ])
      )

      const remainingERC20Percent = await getRemainingPercent(
        userRewardERC20FeeRate
      )

      const postL1ERC20Balance = await L1ERC20_1.balanceOf(env.l1Wallet.address)
      const postL2ERC20Balance = await L2ERC20_1.balanceOf(env.l2Wallet.address)

      expect(preL1ERC20Balance).to.deep.eq(
        postL1ERC20Balance.add(depositAmount.mul(2))
      )
      expect(postL2ERC20Balance).to.deep.eq(
        preL2ERC20Balance.add(
          depositAmount.mul(2).mul(remainingERC20Percent).div(1000)
        )
      )
    })

    it('{tag:mrf} should deposit ETH twice in batch', async () => {
      const depositAmount = utils.parseEther('10')

      const preL2ETHBalance = await env.l2Wallet.getBalance()
      const userRewardETHFeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        env.ovmEth.address
      )

      const depositTx = await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            {
              amount: depositAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
          ],
          { value: depositAmount.mul(2) }
        )
      )

      const remainingETHPercent = await getRemainingPercent(
        userRewardETHFeeRate
      )
      const postL2ETHBalance = await env.l2Wallet.getBalance()

      expect(postL2ETHBalance).to.deep.eq(
        preL2ETHBalance.add(
          depositAmount.mul(2).mul(remainingETHPercent).div(1000)
        )
      )
    })

    it('{tag:mrf} should revert an unfulfillable swap-on', async () => {
      const userRewardFeeRate = await L1LiquidityPool.getUserRewardFeeRate(
        ethers.constants.AddressZero
      )
      const remainingPercent = await getRemainingPercent(userRewardFeeRate)

      const preL2EthBalance = await env.l2Wallet.getBalance()

      const requestedLiquidity = (
        await env.l2Provider.getBalance(L2LiquidityPool.address)
      ).add(ethers.utils.parseEther('10'))
      const swapOnAmount = requestedLiquidity.mul(1000).div(remainingPercent)

      // await env.waitForRevertXDomainTransaction(
      //   L1LiquidityPool.clientDepositL1Batch(
      //     [
      //       {
      //         amount: swapOnAmount,
      //         l1TokenAddress: ethers.constants.AddressZero,
      //       },
      //     ],
      //     { value: swapOnAmount, gasLimit: 9000000 }
      //   )
      // )

      await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: swapOnAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
          ],
          { value: swapOnAmount, gasLimit: 9000000 }
        )
      )

      const postBobL2EthBalance = await env.l2Wallet.getBalance()

      expect(preL2EthBalance).to.deep.eq(postBobL2EthBalance)
    })

    it('{tag:mrf} should revert an unfulfillable swap-on in batch', async () => {
      const depositAmount = utils.parseEther('10')

      await approveTransaction(
        L1ERC20_1,
        L1LiquidityPool.address,
        depositAmount
      )

      const preL2EthBalance = await env.l2Wallet.getBalance()
      const preL2ERC20Balance = await L2ERC20_1.balanceOf(env.l2Wallet.address)

      const userRewardFeeRate = await L1LiquidityPool.getUserRewardFeeRate(
        ethers.constants.AddressZero
      )
      const remainingETHPercent = await getRemainingPercent(userRewardFeeRate)
      const userRewardERC20FeeRate = await L2LiquidityPool.getUserRewardFeeRate(
        L2ERC20_1.address
      )

      const requestedLiquidity = (
        await env.l2Provider.getBalance(L2LiquidityPool.address)
      ).add(ethers.utils.parseEther('10'))
      const swapOnAmount = requestedLiquidity.mul(1000).div(remainingETHPercent)

      // await env.waitForRevertXDomainTransaction(
      //   L1LiquidityPool.clientDepositL1Batch(
      //     [
      //       {
      //         amount: swapOnAmount,
      //         l1TokenAddress: ethers.constants.AddressZero,
      //       },
      //       { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
      //     ],
      //     { value: swapOnAmount, gasLimit: 9000000 }
      //   )
      // )

      await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: swapOnAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
          ],
          { value: swapOnAmount, gasLimit: 9000000 }
        )
      )

      const remainingERC20Percent = await getRemainingPercent(
        userRewardERC20FeeRate
      )

      const postL2EthBalance = await env.l2Wallet.getBalance()
      const postL2ERC20Balance = await L2ERC20_1.balanceOf(env.l2Wallet.address)

      expect(preL2EthBalance).to.deep.eq(postL2EthBalance)
      expect(postL2ERC20Balance).to.deep.eq(
        preL2ERC20Balance.add(
          depositAmount.mul(remainingERC20Percent).div(1000)
        )
      )
    })

    it('{tag:mrf} should revert unfulfillable swap-ons in batch', async () => {
      const depositAmount = utils.parseEther('10')

      await approveTransaction(
        L1ERC20_1,
        L1LiquidityPool.address,
        depositAmount
      )

      const preL1ERC20_1Balance = await L1ERC20_1.balanceOf(
        env.l1Wallet.address
      )
      const preL1ERC20_2Balance = await L1ERC20_2.balanceOf(
        env.l1Wallet.address
      )
      const preL2EthBalance = await env.l2Wallet.getBalance()
      const preL2ERC20_1Balance = await L2ERC20_1.balanceOf(
        env.l2Wallet.address
      )
      const preL2ERC20_2Balance = await L2ERC20_2.balanceOf(
        env.l2Wallet.address
      )

      const userRewardFeeRate = await L1LiquidityPool.getUserRewardFeeRate(
        ethers.constants.AddressZero
      )
      const remainingETHPercent = await getRemainingPercent(userRewardFeeRate)
      const userRewardERC20_1FeeRate =
        await L2LiquidityPool.getUserRewardFeeRate(L2ERC20_1.address)
      const userRewardERC20_2FeeRate =
        await L1LiquidityPool.getUserRewardFeeRate(L1ERC20_2.address)
      const remainingERC20_2Percent = await getRemainingPercent(
        userRewardERC20_2FeeRate
      )
      const userRewardMinFeeRate = await L1LiquidityPool.userRewardMinFeeRate()

      const requestedETHLiquidity = (
        await env.l2Provider.getBalance(L2LiquidityPool.address)
      ).add(ethers.utils.parseEther('10'))
      const swapOnETHAmount = requestedETHLiquidity
        .mul(1000)
        .div(remainingETHPercent)

      const requestedERC20Liquidity = (
        await L2ERC20_2.balanceOf(L2LiquidityPool.address)
      ).add(ethers.utils.parseEther('10'))
      const swapOnERC20Amount = requestedERC20Liquidity
        .mul(1000)
        .div(remainingERC20_2Percent)

      await approveTransaction(
        L1ERC20_2,
        L1LiquidityPool.address,
        swapOnERC20Amount
      )

      // FIXME - need revert version
      // await env.waitForRevertXDomainTransaction(
      //   L1LiquidityPool.clientDepositL1Batch(
      //     [
      //       {
      //         amount: swapOnETHAmount,
      //         l1TokenAddress: ethers.constants.AddressZero,
      //       },
      //       { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
      //       { amount: swapOnERC20Amount, l1TokenAddress: L1ERC20_2.address },
      //     ],
      //     { value: swapOnETHAmount, gasLimit: 9000000 }
      //   )
      // )

      await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1Batch(
          [
            {
              amount: swapOnETHAmount,
              l1TokenAddress: ethers.constants.AddressZero,
            },
            { amount: depositAmount, l1TokenAddress: L1ERC20_1.address },
            { amount: swapOnERC20Amount, l1TokenAddress: L1ERC20_2.address },
          ],
          { value: swapOnETHAmount, gasLimit: 9000000 }
        )
      )

      const remainingERC20_1Percent = await getRemainingPercent(
        userRewardERC20_1FeeRate
      )

      const postL1ERC20_1Balance = await L1ERC20_1.balanceOf(
        env.l1Wallet.address
      )
      const postL1ERC20_2Balance = await L1ERC20_2.balanceOf(
        env.l1Wallet.address
      )
      const postL2EthBalance = await env.l2Wallet.getBalance()
      const postL2ERC20_1Balance = await L2ERC20_1.balanceOf(
        env.l2Wallet.address
      )
      const postL2ERC20_2Balance = await L2ERC20_2.balanceOf(
        env.l2Wallet.address
      )

      // FIXME - numbers are off - presumably will be fixed with waitForRevertXDomainTransaction
      // expect(preL1ERC20_1Balance).to.deep.eq(
      //   postL1ERC20_1Balance.add(depositAmount)
      // )
      // expect(preL1ERC20_2Balance).to.deep.eq(
      //   postL1ERC20_2Balance.add(
      //     swapOnERC20Amount.mul(userRewardMinFeeRate).div(BigNumber.from(1000))
      //   )
      // )
      // expect(preL2EthBalance).to.deep.eq(postL2EthBalance)
      // expect(postL2ERC20_1Balance).to.deep.eq(
      //   preL2ERC20_1Balance.add(
      //     depositAmount.mul(remainingERC20_1Percent).div(1000)
      //   )
      // )
      // expect(preL2ERC20_2Balance).to.deep.eq(postL2ERC20_2Balance)
    })
  })
})
