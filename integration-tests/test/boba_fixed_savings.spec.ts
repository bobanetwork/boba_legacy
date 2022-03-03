import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'
import { Direction } from './shared/watcher-utils'
import { getContractFactory } from '@eth-optimism/contracts'

import L2ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import BobaFixedSavingsJson from '@boba/contracts/artifacts/contracts/BobaFixedSavings.sol/BobaFixedSavings.json'
import xL2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/xL2GovernanceERC20.sol/xL2GovernanceERC20.json'
import ProxyJson from '@boba/contracts/artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'

import { OptimismEnv } from './shared/env'
import { l2Wallet, l2Wallet_2 } from './shared/utils'

describe('Boba Fixed Savings', async () => {
  let Factory__L2ERC20: ContractFactory
  let Factory__ImplementationFixedSavings: ContractFactory
  let Factory__xGovL2ERC20: ContractFactory

  let L2Boba: Contract
  let ImplementationFixedSavings: Contract
  let FixedSavings: Contract
  let xGovL2ERC20: Contract

  let env: OptimismEnv

  const initialSupply = utils.parseEther('10000000000')
  const tokenName = 'BOBA'
  const tokenSymbol = 'BOBA'

  const stakeAmount = utils.parseEther('100')
  const FLAT_INTEREST_PER_PERIOD = 22
  const LOCK_TIME = 14 * 24 * 60 * 60 // 2 weeks
  const UNSTAKE_TIME = 2 * 24 * 60 * 60 // 2 days

  const moveTimeForward = async (time = 0) => {
    const Factory__L1ERC20 = new ContractFactory(
      L2ERC20Json.abi,
      L2ERC20Json.bytecode,
      env.l1Wallet
    )

    const L1ERC20 = await Factory__L1ERC20.deploy(
      utils.parseEther('10000000000'),
      'JLKN',
      'JLKN',
      18
    )
    await L1ERC20.deployTransaction.wait()

    const L1StandardBridgeAddress = await env.addressManager.getAddress(
      'Proxy__L1StandardBridge'
    )

    const L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)

    const L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()

    Factory__L2ERC20 = getContractFactory('L2StandardERC20', env.l2Wallet)

    const L2ERC20 = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      L1ERC20.address,
      'JLKN',
      'JLKN',
      18
    )
    await L2ERC20.deployTransaction.wait()

    // increase l1 time and in turn change the l2 timestamp
    await env.l1Provider.send('evm_increaseTime', [time])
    await env.l1Provider.send('evm_mine', [])
    const approveL1ERC20TX = await L1ERC20.approve(
      L1StandardBridge.address,
      utils.parseEther('100')
    )
    await approveL1ERC20TX.wait()

    await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        L1ERC20.address,
        L2ERC20.address,
        utils.parseEther('100'),
        9999999,
        ethers.utils.formatBytes32String(new Date().getTime().toString())
      ),
      Direction.L1ToL2
    )
  }

  before(async () => {
    env = await OptimismEnv.new()

    Factory__L2ERC20 = new ContractFactory(
      L2ERC20Json.abi,
      L2ERC20Json.bytecode,
      env.l2Wallet
    )

    //we deploy a new erc20 call it L2BOBA
    L2Boba = await Factory__L2ERC20.deploy(
      initialSupply,
      tokenName,
      tokenSymbol,
      18
    )
    await L2Boba.deployTransaction.wait()

    Factory__xGovL2ERC20 = new ContractFactory(
      xL2GovernanceERC20Json.abi,
      xL2GovernanceERC20Json.bytecode,
      env.l2Wallet
    )

    xGovL2ERC20 = await Factory__xGovL2ERC20.deploy('xBOBA', 'xBOBA', 18)
    await xGovL2ERC20.deployTransaction.wait()

    Factory__ImplementationFixedSavings = new ContractFactory(
      BobaFixedSavingsJson.abi,
      BobaFixedSavingsJson.bytecode,
      env.l2Wallet
    )

    ImplementationFixedSavings =
      await Factory__ImplementationFixedSavings.deploy()
    await ImplementationFixedSavings.deployTransaction.wait()

    const Factory__Proxy__FixedSavings = new ContractFactory(
      ProxyJson.abi,
      ProxyJson.bytecode,
      env.l2Wallet
    )

    const Proxy__FixedSavings = await Factory__Proxy__FixedSavings.deploy(
      ImplementationFixedSavings.address
    )
    await Proxy__FixedSavings.deployTransaction.wait()

    FixedSavings = new ethers.Contract(
      Proxy__FixedSavings.address,
      BobaFixedSavingsJson.abi,
      env.l2Wallet
    )

    const initFixedSavings = await FixedSavings.initialize(
      L2Boba.address,
      xGovL2ERC20.address
    )
    await initFixedSavings.wait()

    // Add controller
    const addController = await xGovL2ERC20.addController(FixedSavings.address)
    await addController.wait()
  })

  describe('Initialization', async () => {
    it('{tag:boba} should have correct L2BOBA address set', async () => {
      const l2Boba = await FixedSavings.l2Boba()
      expect(l2Boba).to.eq(L2Boba.address)
    })

    it('{tag:boba} should have correct xBOBA address set', async () => {
      const xBoba = await FixedSavings.xBoba()
      expect(xBoba).to.eq(xGovL2ERC20.address)
    })

    it('{tag:boba} should have correct owner address set', async () => {
      const owner = await FixedSavings.owner()
      expect(owner).to.eq(env.l2Wallet.address)
    })

    it('{tag:boba} totalStakeCount should be zero', async () => {
      const totalStakeCount = await FixedSavings.totalStakeCount()
      expect(totalStakeCount).to.eq(0)
    })

    it('{tag:boba} should not be able to initialize again', async () => {
      await expect(
        FixedSavings.initialize(L2Boba.address, xGovL2ERC20.address)
      ).to.be.revertedWith('Contract has been initialized')
    })
  })

  describe('Staking', async () => {
    it('{tag:boba} should fail staking zero amount', async () => {
      await expect(FixedSavings.stake(0)).to.be.revertedWith(
        'Amount to stake cannot be zero'
      )
    })

    it('{tag:boba} should fail staking without enough BOBA balance', async () => {
      await expect(
        FixedSavings.connect(l2Wallet_2.address).stake(100)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('{tag:boba} should fail staking with incorrect staking amount', async () => {
      const bobaBalance = await L2Boba.balanceOf(env.l2Wallet_2.address)
      await expect(
        FixedSavings.connect(env.l2Wallet_2.address).stake(bobaBalance.add(1))
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('{tag:boba} should fail staking with incorrect amount approved', async () => {
      await L2Boba.connect(env.l2Wallet_2).approve(FixedSavings.address, 100)
      await expect(
        FixedSavings.connect(env.l2Wallet_2.address).stake(101)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    let preBalanceStaker
    let preXBobaBalance
    let preBalanceSavingsContract
    let preStakeCount
    let stakeBlock
    let prePersonalStakeCount
    describe('When user has enough BOBA approved', async () => {
      before(async () => {
        await L2Boba.approve(FixedSavings.address, stakeAmount)
        preBalanceStaker = await L2Boba.balanceOf(env.l2Wallet.address)
        preBalanceSavingsContract = await L2Boba.balanceOf(FixedSavings.address)
        preStakeCount = await FixedSavings.totalStakeCount()
        prePersonalStakeCount = await FixedSavings.personalStakeCount(
          env.l2Wallet.address
        )
        preXBobaBalance = await xGovL2ERC20.balanceOf(env.l2Wallet.address)
        const stakeTx = await FixedSavings.stake(stakeAmount)
        const receipt = await stakeTx.wait()
        stakeBlock = receipt.blockNumber
      })

      it('{tag:boba} should successfully stake amount with correct parameters', async () => {
        const postBalanceStaker = await L2Boba.balanceOf(env.l2Wallet.address)
        const postBalanceSavingsContract = await L2Boba.balanceOf(
          FixedSavings.address
        )

        expect(postBalanceStaker).to.eq(preBalanceStaker.sub(stakeAmount))
        expect(postBalanceSavingsContract).to.eq(
          preBalanceSavingsContract.add(stakeAmount)
        )
      })

      it('{tag:boba} should increase total stake count', async () => {
        const stakeCountNow = await FixedSavings.totalStakeCount()
        expect(stakeCountNow).to.be.eq(preStakeCount.add(1))
      })

      it('{tag:boba} should store the correct stake data', async () => {
        const stakePos = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakePos)

        expect(stakeData.stakeId).to.be.eq(stakePos)
        expect(stakeData.account).to.be.eq(env.l2Wallet.address)
        expect(stakeData.depositAmount).to.be.eq(stakeAmount)
        expect(stakeData.isActive).to.be.eq(true)

        const stakeTime = (await env.l2Provider.getBlock(stakeBlock)).timestamp
        expect(stakeData.depositTimestamp).to.be.eq(BigNumber.from(stakeTime))

        const personalStakeCount = await FixedSavings.personalStakeCount(
          env.l2Wallet.address
        )

        expect(personalStakeCount).to.be.eq(prePersonalStakeCount.add(1))
        // latest stake should be correct stake Id
        const latestStakeId = await FixedSavings.personalStakePos(
          env.l2Wallet.address,
          personalStakeCount.sub(1)
        )
        expect(latestStakeId).to.be.eq(stakeData.stakeId)
      })

      it('{tag:boba} should mint xBOBA for user', async () => {
        const xBOBABalance = await xGovL2ERC20.balanceOf(env.l2Wallet.address)
        expect(xBOBABalance).to.be.eq(preXBobaBalance.add(stakeAmount))
      })

      it('{tag:boba} should increment stakeId for next stakes', async () => {
        const preStakePos = await FixedSavings.totalStakeCount()

        // new stake
        await L2Boba.transfer(env.l2Wallet_2.address, stakeAmount)
        await L2Boba.connect(env.l2Wallet_2).approve(
          FixedSavings.address,
          stakeAmount
        )
        await FixedSavings.connect(env.l2Wallet_2).stake(stakeAmount)
        const stakePos = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakePos)
        expect(stakeData.stakeId).to.be.eq(stakePos)
        expect(stakeData.account).to.be.eq(env.l2Wallet_2.address)
        expect(stakeData.stakeId).to.be.eq(preStakePos.add(1))

        await L2Boba.connect(env.l2Wallet).approve(
          FixedSavings.address,
          stakeAmount
        )
        await FixedSavings.connect(env.l2Wallet).stake(stakeAmount)
        const nextStakePos = await FixedSavings.totalStakeCount()
        const nextStakeData = await FixedSavings.stakeDataMap(nextStakePos)
        expect(nextStakeData.stakeId).to.be.eq(nextStakePos)
        expect(nextStakeData.account).to.be.eq(env.l2Wallet.address)
        expect(nextStakeData.stakeId).to.be.eq(stakePos.add(1))
      })
    })
  })

  describe('Unstaking', async () => {
    it('{tag:boba} should not be able to unstake non owned stake', async () => {
      const personalStakeCount = await FixedSavings.personalStakeCount(
        env.l2Wallet.address
      )
      const ownedStakeId = await FixedSavings.personalStakePos(
        env.l2Wallet.address,
        personalStakeCount.sub(1)
      )
      const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
      expect(stakeData.account).to.not.eq(env.l2Wallet_2.address)
      await expect(
        FixedSavings.connect(env.l2Wallet_2.address).unstake(stakeData.stakeId)
      ).to.be.revertedWith('Sender not owner of the funds')
    })

    it('{tag:boba} should not be able to unstake stake before lock', async () => {
      const personalStakeCount = await FixedSavings.personalStakeCount(
        env.l2Wallet.address
      )
      const ownedStakeId = await FixedSavings.personalStakePos(
        env.l2Wallet.address,
        personalStakeCount.sub(1)
      )
      const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
      const depositTime = stakeData.depositTimestamp
      await expect(
        FixedSavings.connect(env.l2Wallet.address).unstake(stakeData.stakeId)
      ).to.be.revertedWith('Not in unstaking period')

      // advance time until the end of lock period
      const expectedLockEndTime = depositTime.add(BigNumber.from(LOCK_TIME))

      // current l2 time
      const blocknum = await env.l2Provider.getBlockNumber()
      const timeNow = (await env.l2Provider.getBlock(blocknum)).timestamp
      // we stop before the end
      const timeToMove = expectedLockEndTime
        .sub(BigNumber.from(timeNow))
        .sub(BigNumber.from(3600))

      await moveTimeForward(timeToMove.toNumber())
      // still not in unstaking period
      await expect(
        FixedSavings.connect(env.l2Wallet).unstake(stakeData.stakeId)
      ).to.be.revertedWith('Not in unstaking period')
    })

    let preBalanceStaker
    let preXBobaBalance
    let preBalanceSavingsContract
    describe('when in unstaking period after lock', async () => {
      before(async () => {
        // transfer rewards BOBA to contract
        // TODO warp time on l2
        // await L2Boba.transfer(FixedSavings.address, utils.parseEther('10'))
        // const blocknum = await env.l2Provider.getBlockNumber()
        // const timeNow = (await env.l2Provider.getBlock(blocknum)).timestamp
        // const stakeId = await FixedSavings.totalStakeCount()
        // const stakeData = await FixedSavings.stakeDataMap(stakeId)
        // const expectedLockEndTime = stakeData.depositTimestamp.add(
        //   BigNumber.from(LOCK_TIME)
        // )
        // const timeToMove = expectedLockEndTime.sub(BigNumber.from(timeNow))
        // await moveTimeForward(timeToMove.toNumber())
        // preBalanceStaker = await L2Boba.balanceOf(env.l2Wallet.address)
        // preBalanceSavingsContract = await L2Boba.balanceOf(FixedSavings.address)
        // preXBobaBalance = await xGovL2ERC20.balanceOf(env.l2Wallet.address)
        // await FixedSavings.unstake(stakeId)
      })
      // TODO warp time on l2
      it.skip('should be able to unstake', async () => {
        // calculate expected rewards
        const noOfPeriods = 1 // expect to unstake after first period
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        const rewards = stakeData.depositAmount
          .mul(FLAT_INTEREST_PER_PERIOD)
          .mul(noOfPeriods)
          .div(10000)
        const postBalanceStaker = await L2Boba.balanceOf(env.l2Wallet.address)
        const postBalanceSavingsContract = await L2Boba.balanceOf(
          FixedSavings.address
        )

        expect(postBalanceStaker).to.be.eq(
          preBalanceStaker.add(stakeData.depositAmount).add(rewards)
        )
        expect(postBalanceSavingsContract).to.be.eq(
          preBalanceSavingsContract.sub(stakeData.depositAmount).sub(rewards)
        )
      })
      // TODO warp time on l2
      it.skip('should update the stake data', async () => {
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        expect(stakeData.isActive).to.be.eq(false)
      })
      // TODO warp time on l2
      it.skip('should burn xBOBA for user', async () => {
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        const xBOBABalance = await xGovL2ERC20.balanceOf(env.l2Wallet.address)
        expect(xBOBABalance).to.be.eq(
          preXBobaBalance.sub(stakeData.depositAmount)
        )
      })
      // TODO warp time on l2
      it.skip('should not be able to unstake again', async () => {
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        await expect(
          FixedSavings.connect(env.l2Wallet).unstake(stakeData.stakeId)
        ).to.be.revertedWith('Stake is not active or already claimed')
      })
    })

    // check for two period
    describe('when unstaking after multiple periods', async () => {
      it('{tag:boba} should not allow unstaking at lock periods', async () => {
        const personalStakeCount = await FixedSavings.personalStakeCount(
          env.l2Wallet.address
        )
        const ownedStakeId = await FixedSavings.personalStakePos(
          env.l2Wallet.address,
          personalStakeCount.sub(2)
        )

        const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
        const depositTime = stakeData.depositTimestamp

        const expectedLockEndTime = depositTime.add(BigNumber.from(LOCK_TIME))

        // current l2 time
        const blocknum = await env.l2Provider.getBlockNumber()
        const timeNow = (await env.l2Provider.getBlock(blocknum)).timestamp

        // we stop once after the unstake period ends
        const timeToMove = expectedLockEndTime
          .add(BigNumber.from(UNSTAKE_TIME))
          .sub(BigNumber.from(timeNow))

        // move time to after the first period
        // one period completed here
        await moveTimeForward(timeToMove.toNumber())
        await expect(
          FixedSavings.connect(env.l2Wallet).unstake(stakeData.stakeId)
        ).to.be.revertedWith('Not in unstaking period')
        // this is the start of second period
      })
      // TODO warp time on l2
      it.skip('should be able to unstake in the unstake period after second lock', async () => {
        const personalStakeCount = await FixedSavings.personalStakeCount(
          env.l2Wallet.address
        )
        const ownedStakeId = await FixedSavings.personalStakePos(
          env.l2Wallet.address,
          personalStakeCount.sub(2)
        )

        const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
        const depositTime = stakeData.depositTimestamp

        const expectedLockEndTimeSecondPeriod = depositTime
          .add(BigNumber.from(LOCK_TIME))
          .add(BigNumber.from(UNSTAKE_TIME))
          .add(BigNumber.from(LOCK_TIME))

        // current l2 time
        const blocknum = await env.l2Provider.getBlockNumber()
        const timeNow = (await env.l2Provider.getBlock(blocknum)).timestamp

        // we stop after the second lock period ends
        const timeToMove = expectedLockEndTimeSecondPeriod.sub(
          BigNumber.from(timeNow)
        )
        await moveTimeForward(timeToMove.toNumber())

        const BalanceStakerBeforeUnstake = await L2Boba.balanceOf(
          env.l2Wallet.address
        )
        const BalanceSavingsContractBeforeUnstake = await L2Boba.balanceOf(
          FixedSavings.address
        )

        await FixedSavings.unstake(ownedStakeId)

        // calculate expected rewards
        const noOfPeriods = 2 // expect to unstake after first period
        const rewards = stakeData.depositAmount
          .mul(FLAT_INTEREST_PER_PERIOD)
          .mul(noOfPeriods)
          .div(10000)

        const postBalanceStaker = await L2Boba.balanceOf(env.l2Wallet.address)
        const postBalanceSavingsContract = await L2Boba.balanceOf(
          FixedSavings.address
        )

        expect(postBalanceStaker).to.be.eq(
          BalanceStakerBeforeUnstake.add(stakeData.depositAmount).add(rewards)
        )
        expect(postBalanceSavingsContract).to.be.eq(
          BalanceSavingsContractBeforeUnstake.sub(stakeData.depositAmount).sub(
            rewards
          )
        )
        expect(await xGovL2ERC20.balanceOf(env.l2Wallet.address)).to.be.eq(0)
        await expect(
          FixedSavings.connect(env.l2Wallet).unstake(stakeData.stakeId)
        ).to.be.revertedWith('Stake is not active or already claimed')
      })
    })

    // check for stopped period
    describe('when unstaking after contract interest is closed', async () => {
      it('{tag:boba} should not allow non owner to stop the interest bearing contract', async () => {
        await expect(
          FixedSavings.connect(env.l2Wallet_2).stopStakingContract()
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('{tag:boba} should allow owner to stop the interest bearing contract', async () => {
        // move time to account for one more period first
        const personalStakeCount = await FixedSavings.personalStakeCount(
          env.l2Wallet_2.address
        )
        const ownedStakeId = await FixedSavings.personalStakePos(
          env.l2Wallet_2.address,
          personalStakeCount.sub(1)
        )

        const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
        const depositTime = stakeData.depositTimestamp

        const expectedLockEndTimeSecondPeriod = depositTime
          .add(BigNumber.from(LOCK_TIME))
          .add(BigNumber.from(UNSTAKE_TIME))
          .add(BigNumber.from(LOCK_TIME))
          .add(BigNumber.from(UNSTAKE_TIME))

        // current l2 time
        const blocknum = await env.l2Provider.getBlockNumber()
        const timeNow = (await env.l2Provider.getBlock(blocknum)).timestamp

        // we stop after the second lock period ends
        const timeToMove = expectedLockEndTimeSecondPeriod.sub(
          BigNumber.from(timeNow)
        )

        await moveTimeForward(timeToMove.toNumber())

        expect(await FixedSavings.owner()).to.be.eq(env.l2Wallet.address)
        await FixedSavings.connect(env.l2Wallet).stopStakingContract()
        const blocknumAfterStop = await env.l2Provider.getBlockNumber()
        const timeNowAfterStop = (
          await env.l2Provider.getBlock(blocknumAfterStop)
        ).timestamp
        const stopTime = await FixedSavings.stakingCloseTimestamp()
        expect(stopTime).to.not.eq(0)
        expect(stopTime).to.be.eq(timeNowAfterStop)
      }).timeout(100000)

      it('{tag:boba} should not allow to restop interest bearing contract', async () => {
        await expect(
          FixedSavings.connect(env.l2Wallet).stopStakingContract()
        ).to.be.revertedWith('Already closed')
      })

      it('{tag:boba} should not allow new stakes after stopping contract', async () => {
        await L2Boba.connect(env.l2Wallet).approve(FixedSavings.address, 100)
        await expect(
          FixedSavings.connect(env.l2Wallet).stake(100)
        ).to.be.revertedWith('Staking contract is closed')
      })
      // TODO warp time on l2
      it.skip(
        'should give out rewards until the contract was stopped',
        async () => {
          const personalStakeCount = await FixedSavings.personalStakeCount(
            env.l2Wallet_2.address
          )
          const ownedStakeId = await FixedSavings.personalStakePos(
            env.l2Wallet_2.address,
            personalStakeCount.sub(1)
          )

          const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
          const depositTime = stakeData.depositTimestamp

          const expectedLockEndTimeFourPeriod = depositTime
            .add(BigNumber.from(LOCK_TIME * 4))
            .add(BigNumber.from(UNSTAKE_TIME * 3))

          // current l2 time
          const blocknum = await env.l2Provider.getBlockNumber()
          const timeNow = (await env.l2Provider.getBlock(blocknum)).timestamp

          // we stop after the second lock period ends
          const timeToMove = expectedLockEndTimeFourPeriod.sub(
            BigNumber.from(timeNow)
          )

          await moveTimeForward(timeToMove.toNumber())

          const BalanceStakerBeforeUnstake = await L2Boba.balanceOf(
            env.l2Wallet_2.address
          )
          const BalanceSavingsContractBeforeUnstake = await L2Boba.balanceOf(
            FixedSavings.address
          )

          await FixedSavings.connect(env.l2Wallet_2).unstake(stakeData.stakeId)

          // no of period is four now, but contract stopped in the third period
          const noOfPeriods = 3 //
          const rewards = stakeData.depositAmount
            .mul(FLAT_INTEREST_PER_PERIOD)
            .mul(noOfPeriods)
            .div(10000)

          const postBalanceStaker = await L2Boba.balanceOf(
            env.l2Wallet_2.address
          )
          const postBalanceSavingsContract = await L2Boba.balanceOf(
            FixedSavings.address
          )

          expect(postBalanceStaker).to.be.eq(
            BalanceStakerBeforeUnstake.add(stakeData.depositAmount).add(rewards)
          )
          expect(postBalanceSavingsContract).to.be.eq(
            BalanceSavingsContractBeforeUnstake.sub(
              stakeData.depositAmount
            ).sub(rewards)
          )
        }
      ).timeout(100000)
    })
  })
})
