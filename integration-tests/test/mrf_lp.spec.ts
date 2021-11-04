import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'
import { Direction } from './shared/watcher-utils'
import { expectLogs } from './shared/utils'
import { getContractFactory } from '@eth-optimism/contracts'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'

import L1LiquidityPoolJson from '@boba/contracts/artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '@boba/contracts/artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import L2TokenPoolJson from '@boba/contracts/artifacts/contracts/TokenPool.sol/TokenPool.json'

import { OptimismEnv } from './shared/env'

describe('Liquidity Pool Test', async () => {
  let Factory__L1ERC20: ContractFactory
  let Factory__L2ERC20: ContractFactory

  let L1LiquidityPool: Contract
  let L2LiquidityPool: Contract
  let L1ERC20: Contract
  let L2ERC20: Contract
  let L1StandardBridge: Contract
  let L2TokenPool: Contract

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

    const L1StandardBridgeAddress = await env.addressManager.getAddress(
      'Proxy__L1StandardBridge'
    )

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

    Factory__L2ERC20 = getContractFactory('L2StandardERC20', env.l2Wallet)

    L2ERC20 = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      L1ERC20.address,
      tokenName,
      tokenSymbol,
      18
    )
    await L2ERC20.deployTransaction.wait()

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
  })

  it('should deposit 10000 TEST ERC20 token from L1 to L2', async () => {
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
      ),
      Direction.L1ToL2
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

  it('should transfer L2 ERC20 TEST token from Bob to Alice and Kate', async () => {
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

  it('should add 1000 ERC20 TEST tokens to the L2 token pool', async () => {
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

  it('should register L1 the pool', async () => {
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

  it('should register L2 the pool', async () => {
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

  it("shouldn't update the pool", async () => {
    const registerPoolTX = await L2LiquidityPool.registerPool(
      L1ERC20.address,
      L2ERC20.address,
      { gasLimit: 7000000 }
    )
    await expect(registerPoolTX.wait()).to.be.eventually.rejected
  })

  it('should add L1 liquidity', async () => {
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

  it('should add L2 liquidity', async () => {
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

  it('should fast exit L2', async () => {
    const fastExitAmount = utils.parseEther('10')

    const preKateL1ERC20Balance = await L1ERC20.balanceOf(
      env.l1Wallet_3.address
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
      ),
      Direction.L2ToL1
    )

    const poolInfo = await L1LiquidityPool.poolInfo(L1ERC20.address)

    const userRewardFeeRate = await L1LiquidityPool.userRewardFeeRate()
    const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
    const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
    const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

    expect(poolInfo.accOwnerReward).to.deep.eq(fastExitAmount.mul(ownerRewardFeeRate).div(1000))
    expect(poolInfo.accUserReward).to.deep.eq(fastExitAmount.mul(userRewardFeeRate).div(1000))
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

  it('should withdraw liquidity', async () => {
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

  it("shouldn't withdraw liquidity", async () => {
    const withdrawAmount = utils.parseEther('100')

    const withdrawTX = await L2LiquidityPool.withdrawLiquidity(
      withdrawAmount,
      L2ERC20.address,
      env.l2Wallet.address,
      { gasLimit: 7000000 }
    )
    await expect(withdrawTX.wait()).to.be.eventually.rejected
  })

  it('should withdraw reward from L2 pool', async () => {
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

  it('should withdraw reward from L1 pool', async () => {
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

  it("shouldn't withdraw reward from L2 pool", async () => {
    const withdrawRewardAmount = utils.parseEther('100')

    const withdrawRewardTX = await L2LiquidityPool.withdrawReward(
      withdrawRewardAmount,
      L2ERC20.address,
      env.l2Wallet.address,
      { gasLimit: 7000000 }
    )
    await expect(withdrawRewardTX.wait()).to.be.eventually.rejected
  })

  it('should fast onramp', async () => {
    const depositAmount = utils.parseEther('10')

    const preL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const preL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const prePoolInfo = await L2LiquidityPool.poolInfo(L2ERC20.address)

    const approveL1LPTX = await L1ERC20.approve(
      L1LiquidityPool.address,
      depositAmount,
      { gasLimit: 9000000 }
    )
    await approveL1LPTX.wait()

    const depositTx = await env.waitForXDomainTransaction(
      L1LiquidityPool.clientDepositL1(depositAmount, L1ERC20.address, {
        gasLimit: 9000000,
      }),
      Direction.L1ToL2
    )

    const postL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const postL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const postPoolInfo = await L2LiquidityPool.poolInfo(L2ERC20.address)

    const userRewardFeeRate = await L2LiquidityPool.userRewardFeeRate()
    const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
    const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
    const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

    expect(postL2ERC20Balance).to.deep.eq(
      preL2ERC20Balance.add(depositAmount.mul(remainingPercent).div(1000))
    )

    expect(postL1ERC20Balance).to.deep.eq(preL1ERC20Balance.sub(depositAmount))

    expect(prePoolInfo.accUserReward).to.deep.eq(
      postPoolInfo.accUserReward.sub(depositAmount.mul(userRewardFeeRate).div(1000))
    )

    expect(prePoolInfo.accOwnerReward).to.deep.eq(
      postPoolInfo.accOwnerReward.sub(depositAmount.mul(ownerRewardFeeRate).div(1000))
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

  it('should revert unfulfillable swap-offs', async () => {
    const preBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const preBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)

    const userRewardFeeRate = await L2LiquidityPool.userRewardFeeRate()
    const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
    const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
    const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

    const requestedLiquidity = (
      await L1ERC20.balanceOf(L1LiquidityPool.address)
    ).add(1000)
    const fastExitAmount = requestedLiquidity.mul(1000).div(remainingPercent)

    const approveBobL2TX = await L2ERC20.connect(env.l2Wallet).approve(
      L2LiquidityPool.address,
      fastExitAmount,
      { gasLimit: 7000000 }
    )
    await approveBobL2TX.wait()

    await env.waitForRevertXDomainTransactionFast(
      L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
        fastExitAmount,
        L2ERC20.address,
        { gasLimit: 7000000 }
      ),
      Direction.L2ToL1
    )

    const postBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const postBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    expect(preBobL1ERC20Balance).to.deep.eq(postBobL1ERC20Balance)

    // for precise calculation
    const exitFeesOne = fastExitAmount.mul(userRewardFeeRate).div(1000)
    const exitFeesTwo = fastExitAmount.mul(ownerRewardFeeRate).div(1000)
    const exitFees = exitFeesOne.add(exitFeesTwo)
    expect(postBobL2ERC20Balance).to.deep.eq(preBobL2ERC20Balance.sub(exitFees))
  })

  it('should revert unfulfillable swap-ons', async () => {
    const preL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)
    const preL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)

    const userRewardFeeRate = await L1LiquidityPool.userRewardFeeRate()
    const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
    const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
    const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

    const requestedLiquidity = (
      await L2ERC20.balanceOf(L2LiquidityPool.address)
    ).add(10)
    const swapOnAmount = requestedLiquidity.mul(1000).div(remainingPercent)

    const approveBobL1TX = await L1ERC20.connect(env.l1Wallet).approve(
      L1LiquidityPool.address,
      swapOnAmount
    )
    await approveBobL1TX.wait()

    await env.waitForRevertXDomainTransaction(
      L1LiquidityPool.clientDepositL1(swapOnAmount, L1ERC20.address),
      Direction.L1ToL2
    )

    const postBobL1ERC20Balance = await L1ERC20.balanceOf(env.l1Wallet.address)
    const postBobL2ERC20Balance = await L2ERC20.balanceOf(env.l2Wallet.address)

    // for precise calculation
    const swapOnFeesOne = swapOnAmount.mul(userRewardFeeRate).div(1000)
    const swapOnFeesTwo = swapOnAmount.mul(ownerRewardFeeRate).div(1000)
    const swapOnFees = swapOnFeesOne.add(swapOnFeesTwo)

    expect(preL2ERC20Balance).to.deep.eq(postBobL2ERC20Balance)
    expect(postBobL1ERC20Balance).to.deep.eq(preL1ERC20Balance.sub(swapOnFees))
  })

  it('Should rebalance ERC20', async () => {
    const balanceERC20Amount = utils.parseEther('10')

    const preLPL1ERC20Balance = await L1ERC20.balanceOf(L1LiquidityPool.address)
    const preLPL2ERC20Balance = await L2ERC20.balanceOf(L2LiquidityPool.address)

    await env.waitForXDomainTransaction(
      L1LiquidityPool.rebalanceLP(balanceERC20Amount, L1ERC20.address),
      Direction.L1ToL2
    )

    const postLPL1ERC20Balance = await L1ERC20.balanceOf(
      L1LiquidityPool.address
    )
    const postLPL2ERC20Balance = await L2ERC20.balanceOf(
      L2LiquidityPool.address
    )

    expect(preLPL1ERC20Balance).to.deep.eq(
      postLPL1ERC20Balance.add(balanceERC20Amount)
    )
    expect(preLPL2ERC20Balance).to.deep.eq(
      postLPL2ERC20Balance.sub(balanceERC20Amount)
    )
  })

  it('Should revert rebalancing LP', async() => {
    const balanceERC20Amount = utils.parseEther('10000')

    await expect(
      L1LiquidityPool.connect(env.l1Wallet_2).rebalanceLP(
        balanceERC20Amount,
        '0x0000000000000000000000000000000000000000'
      )
    ).to.be.revertedWith('caller is not the owner')

    await expect(
      L1LiquidityPool.rebalanceLP(balanceERC20Amount, L1ERC20.address)
    ).to.be.reverted
  })

  it('should be able to pause L1LiquidityPool contract', async function () {
    const poolOwner = await L1LiquidityPool.owner()

    // since tests are with deployed contracts
    if (env.l1Wallet.address === poolOwner) {
      const pauseStatusTogglePrior = await L1LiquidityPool.paused()

      expect(pauseStatusTogglePrior).to.eq(false)

      await expect(
        L1LiquidityPool.connect(env.l1Wallet_2).pause()
      ).to.be.revertedWith('caller is not the owner')

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

  it('should be able to pause L2LiquidityPool contract', async function () {
    const poolOwner = await L2LiquidityPool.owner()

    // since tests are with deployed contracts
    if (env.l2Wallet.address === poolOwner) {
      const pauseStatusTogglePrior = await L2LiquidityPool.paused()

      expect(pauseStatusTogglePrior).to.eq(false)

      await expect(
        L2LiquidityPool.connect(env.l2Wallet_2).pause()
      ).to.be.revertedWith('caller is not the owner')

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

  it('the DAO should be able to configure fee for L2LP', async function () {
    // admin will be set to the DAO/timelock in the future
    const poolAdmin = await L2LiquidityPool.DAO()

    // since tests are with deployed contracts
    if (env.l2Wallet.address === poolAdmin) {
      const initialUserRewardFeeRate = await L2LiquidityPool.userRewardFeeRate()
      const initialOwnerRewardFeeRate =
        await L2LiquidityPool.ownerRewardFeeRate()

      // update fee rate
      await L2LiquidityPool.configureFee(
        initialUserRewardFeeRate.add(10),
        initialOwnerRewardFeeRate.add(10)
      )

      const updatedUserRewardFeeRate = await L2LiquidityPool.userRewardFeeRate()
      const updatedOwnerRewardFeeRate =
        await L2LiquidityPool.ownerRewardFeeRate()

      expect(updatedUserRewardFeeRate).to.deep.eq(
        initialUserRewardFeeRate.add(10)
      )
      expect(updatedOwnerRewardFeeRate).to.deep.eq(
        initialOwnerRewardFeeRate.add(10)
      )

      // change to fee back to default
      await L2LiquidityPool.configureFee(
        initialUserRewardFeeRate,
        initialOwnerRewardFeeRate
      )
    } else {
      this.skip()
    }
  })

  it('should fail configuring L2LP fee for non DAO', async () => {
    await expect(
      L2LiquidityPool.connect(env.l2Wallet_2).configureFee(35, 15)
    ).to.be.revertedWith('caller is not the DAO')
  })

  it('the DAO should be able to configure fee for L1LP', async function () {
    // admin will be set to the DAO timelock in the future
    const poolAdmin = await L2LiquidityPool.DAO()

    // since tests are with deployed contracts
    if (env.l2Wallet.address === poolAdmin) {
      const initialUserRewardFeeRate = await L1LiquidityPool.userRewardFeeRate()
      const initialOwnerRewardFeeRate =
        await L1LiquidityPool.ownerRewardFeeRate()

      // update fee rate
      await env.waitForXDomainTransactionFast(
        L2LiquidityPool.configureFeeExits(
          initialUserRewardFeeRate.add(10),
          initialOwnerRewardFeeRate.add(10)
        ),
        Direction.L2ToL1
      )

      const updatedUserRewardFeeRate = await L1LiquidityPool.userRewardFeeRate()
      const updatedOwnerRewardFeeRate =
        await L1LiquidityPool.ownerRewardFeeRate()

      expect(updatedUserRewardFeeRate).to.deep.eq(
        initialUserRewardFeeRate.add(10)
      )
      expect(updatedOwnerRewardFeeRate).to.deep.eq(
        initialOwnerRewardFeeRate.add(10)
      )

      // change to fee back to default
      await env.waitForXDomainTransactionFast(
        L2LiquidityPool.configureFeeExits(
          initialUserRewardFeeRate,
          initialOwnerRewardFeeRate
        ),
        Direction.L2ToL1
      )
    } else {
      this.skip()
    }
  })

  it('should fail configuring L1LP fee for non DAO', async () => {
    await expect(
      L2LiquidityPool.connect(env.l2Wallet_2).configureFeeExits(35, 15)
    ).to.be.revertedWith('caller is not the DAO')

    await expect(L1LiquidityPool.configureFee(35, 15)).to.be.revertedWith(
      'XCHAIN: messenger contract unauthenticated'
    )
  })

  describe('OVM_ETH tests', async () => {
    it('should add L1 liquidity', async () => {
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

    it('should add L2 liquidity', async () => {
      const addLiquidityAmount = utils.parseEther('100')

      const deposit = env.l1Bridge.depositETH(
        9999999,
        utils.formatBytes32String(new Date().getTime().toString()),
        { value: utils.parseEther('100') }
      )
      await env.waitForXDomainTransaction(deposit, Direction.L1ToL2)

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

    it('should fast exit L2', async () => {
      const fastExitAmount = utils.parseEther('10')

      const prebobL1EthBalance = await env.l1Wallet.getBalance()

      const depositTx = await env.waitForXDomainTransactionFast(
        L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
          fastExitAmount,
          env.ovmEth.address,
          { value: fastExitAmount }
        ),
        Direction.L2ToL1
      )

      const postBobL1EthBalance = await env.l1Wallet.getBalance()

      const userRewardFeeRate = await L1LiquidityPool.userRewardFeeRate()
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

    it('Should rebalance ETH', async () => {
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
        ),
        Direction.L1ToL2
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

    it('Should revert rebalancing LP', async () => {
      const balanceETHAmount = utils.parseEther('10000')

      await expect(
        L1LiquidityPool.connect(env.l1Wallet_2).rebalanceLP(
          balanceETHAmount,
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.revertedWith('caller is not the owner')

      await expect(
        L1LiquidityPool.rebalanceLP(
          balanceETHAmount,
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.reverted
    })

    it('should withdraw liquidity', async () => {
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

    it('should withdraw reward from L2 pool', async () => {
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

    it('should fast onramp', async () => {
      const depositAmount = utils.parseEther('10')

      const preL2EthBalance = await env.l2Wallet.getBalance()

      const depositTx = await env.waitForXDomainTransaction(
        L1LiquidityPool.clientDepositL1(depositAmount, env.ovmEth.address, {
          value: depositAmount,
        }),
        Direction.L1ToL2
      )

      const userRewardFeeRate = await L2LiquidityPool.userRewardFeeRate()
      const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

      const postL2EthBalance = await env.l2Wallet.getBalance()

      expect(postL2EthBalance).to.deep.eq(
        preL2EthBalance.add(depositAmount.mul(remainingPercent).div(1000))
      )

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

    it('should revert unfulfillable swap-offs', async () => {
      const userRewardFeeRate = await L2LiquidityPool.userRewardFeeRate()
      const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

      const preBobL1EthBalance = await env.l1Wallet.getBalance()
      const requestedLiquidity = (
        await env.l1Provider.getBalance(L1LiquidityPool.address)
      ).add(10)
      const fastExitAmount = requestedLiquidity.mul(1000).div(remainingPercent)

      await env.waitForRevertXDomainTransactionFast(
        L2LiquidityPool.connect(env.l2Wallet).clientDepositL2(
          fastExitAmount,
          env.ovmEth.address,
          { value: fastExitAmount }
        ),
        Direction.L2ToL1
      )

      const postBobL1EthBalance = await env.l1Wallet.getBalance()

      expect(preBobL1EthBalance).to.deep.eq(postBobL1EthBalance)
    })

    it('should revert unfulfillable swap-ons', async () => {
      const userRewardFeeRate = await L1LiquidityPool.userRewardFeeRate()
      const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
      const totalFeeRate = userRewardFeeRate.add(ownerRewardFeeRate)
      const remainingPercent = BigNumber.from(1000).sub(totalFeeRate)

      const preL2EthBalance = await env.l2Wallet.getBalance()

      const requestedLiquidity = (
        await env.l2Provider.getBalance(L2LiquidityPool.address)
      ).add(10)
      const swapOnAmount = requestedLiquidity.mul(1000).div(remainingPercent)

      await env.waitForRevertXDomainTransaction(
        L1LiquidityPool.clientDepositL1(
          swapOnAmount,
          ethers.constants.AddressZero,
          {
            value: swapOnAmount,
          }
        ),
        Direction.L1ToL2
      )

      const postBobL2EthBalance = await env.l2Wallet.getBalance()

      expect(preL2EthBalance).to.deep.eq(postBobL2EthBalance)
    })
  })
})
