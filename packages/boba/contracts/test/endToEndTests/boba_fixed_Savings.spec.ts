import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { Contract, Signer, BigNumber, utils, BigNumberish } from 'ethers'
import { BlockTag } from '@ethersproject/abstract-provider'

const moveTimeForward = async (time = 0) => {
  await ethers.provider.send('evm_increaseTime', [time])
  await ethers.provider.send('evm_mine', [])
}

let L2Boba: Contract
let FixedSavings: Contract
let xGovL2ERC20: Contract

let signer: Signer
let signer2: Signer
let signerAddress: string
let signer2Address: string

const initialSupply = utils.parseEther('10000000000')
const tokenName = 'BOBA'
const tokenSymbol = 'BOBA'

const stakeAmount = utils.parseEther('100')
const FLAT_INTEREST_PER_PERIOD = 22
const LOCK_TIME = 14 * 24 * 60 * 60 // 2 weeks
const UNSTAKE_TIME = 2 * 24 * 60 * 60 // 2 days

before(async () => {
  L2Boba = await (
    await ethers.getContractFactory('L1ERC20')
  ).deploy(initialSupply, tokenName, tokenSymbol, 18)

  xGovL2ERC20 = await (
    await ethers.getContractFactory('xL2GovernanceERC20')
  ).deploy('xBOBA', 'xBOBA', 18)

  FixedSavings = await (
    await ethers.getContractFactory('BobaFixedSavings')
  ).deploy()

  const initFixedSavings = await FixedSavings.initialize(
    L2Boba.address,
    xGovL2ERC20.address
  )
  await initFixedSavings.wait()

  // Add controller
  const addController = await xGovL2ERC20.addController(FixedSavings.address)
  await addController.wait()
})

describe('Boba Fixed Savings Tests', async () => {
  before(async () => {
    signer = (await ethers.getSigners())[0]
    signer2 = (await ethers.getSigners())[1]
    signerAddress = await signer.getAddress()
    signer2Address = await signer2.getAddress()
  })

  describe('Initialization', async () => {
    it('should have correct L2BOBA address set', async () => {
      const l2Boba = await FixedSavings.l2Boba()
      expect(l2Boba).to.eq(L2Boba.address)
    })

    it('should have correct xBOBA address set', async () => {
      const xBoba = await FixedSavings.xBoba()
      expect(xBoba).to.eq(xGovL2ERC20.address)
    })

    it('should have correct owner address set', async () => {
      const owner = await FixedSavings.owner()
      expect(owner).to.eq(signerAddress)
    })

    it('totalStakeCount should be zero', async () => {
      const totalStakeCount = await FixedSavings.totalStakeCount()
      expect(totalStakeCount).to.eq(0)
    })

    it('should not be able to initialize again', async () => {
      await expect(
        FixedSavings.initialize(L2Boba.address, xGovL2ERC20.address)
      ).to.be.revertedWith('Contract has been initialized')
    })
  })

  describe('Staking', async () => {
    it('should fail staking zero amount', async () => {
      await expect(FixedSavings.stake(0)).to.be.revertedWith(
        'Amount to stake cannot be zero'
      )
    })

    it('should fail staking without enough BOBA balance', async () => {
      await expect(FixedSavings.connect(signer2).stake(100)).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      )
    })

    it('should fail staking with incorrect staking amount', async () => {
      const bobaBalance = await L2Boba.balanceOf(signer2Address)
      await expect(
        FixedSavings.connect(signer2).stake(bobaBalance.add(1))
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('should fail staking with incorrect amount approved', async () => {
      await L2Boba.connect(signer2).approve(FixedSavings.address, 100)
      await expect(FixedSavings.connect(signer2).stake(101)).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      )
    })

    let preBalanceStaker: BigNumber
    let preXBobaBalance: BigNumber
    let preBalanceSavingsContract: BigNumber
    let preStakeCount: BigNumber
    let stakeBlock: BlockTag
    let prePersonalStakeCount: BigNumber
    describe('When user has enough BOBA approved', async () => {
      before(async () => {
        await L2Boba.approve(FixedSavings.address, stakeAmount)
        preBalanceStaker = await L2Boba.balanceOf(signerAddress)
        preBalanceSavingsContract = await L2Boba.balanceOf(FixedSavings.address)
        preStakeCount = await FixedSavings.totalStakeCount()
        prePersonalStakeCount = await FixedSavings.personalStakeCount(
          signerAddress
        )
        preXBobaBalance = await xGovL2ERC20.balanceOf(signerAddress)
        const stakeTx = await FixedSavings.stake(stakeAmount)
        const receipt = await stakeTx.wait()
        stakeBlock = receipt.blockNumber
      })

      it('should successfully stake amount with correct parameters', async () => {
        const postBalanceStaker = await L2Boba.balanceOf(signerAddress)
        const postBalanceSavingsContract = await L2Boba.balanceOf(
          FixedSavings.address
        )

        expect(postBalanceStaker).to.eq(preBalanceStaker.sub(stakeAmount))
        expect(postBalanceSavingsContract).to.eq(
          preBalanceSavingsContract.add(stakeAmount)
        )
      })

      it('should increase total stake count', async () => {
        const stakeCountNow = await FixedSavings.totalStakeCount()
        expect(stakeCountNow).to.be.eq(preStakeCount.add(1))
      })

      it('should store the correct stake data', async () => {
        const stakePos = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakePos)

        expect(stakeData.stakeId).to.be.eq(stakePos)
        expect(stakeData.account).to.be.eq(signerAddress)
        expect(stakeData.depositAmount).to.be.eq(stakeAmount)
        expect(stakeData.isActive).to.be.eq(true)

        const stakeTime = (await ethers.provider.getBlock(stakeBlock)).timestamp
        expect(stakeData.depositTimestamp).to.be.eq(BigNumber.from(stakeTime))

        const personalStakeCount = await FixedSavings.personalStakeCount(
          signerAddress
        )

        expect(personalStakeCount).to.be.eq(prePersonalStakeCount.add(1))
        // latest stake should be correct stake Id
        const latestStakeId = await FixedSavings.personalStakePos(
          signerAddress,
          personalStakeCount.sub(1)
        )
        expect(latestStakeId).to.be.eq(stakeData.stakeId)
      })

      it('should mint xBOBA for user', async () => {
        const xBOBABalance = await xGovL2ERC20.balanceOf(signerAddress)
        expect(xBOBABalance).to.be.eq(preXBobaBalance.add(stakeAmount))
      })

      it('should increment stakeId for next stakes', async () => {
        const preStakePos = await FixedSavings.totalStakeCount()

        // new stake
        await L2Boba.transfer(signer2Address, stakeAmount)
        await L2Boba.connect(signer2).approve(FixedSavings.address, stakeAmount)
        await FixedSavings.connect(signer2).stake(stakeAmount)
        const stakePos = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakePos)
        expect(stakeData.stakeId).to.be.eq(stakePos)
        expect(stakeData.account).to.be.eq(signer2Address)
        expect(stakeData.stakeId).to.be.eq(preStakePos.add(1))

        await L2Boba.connect(signer).approve(FixedSavings.address, stakeAmount)
        await FixedSavings.connect(signer).stake(stakeAmount)
        const nextStakePos = await FixedSavings.totalStakeCount()
        const nextStakeData = await FixedSavings.stakeDataMap(nextStakePos)
        expect(nextStakeData.stakeId).to.be.eq(nextStakePos)
        expect(nextStakeData.account).to.be.eq(signerAddress)
        expect(nextStakeData.stakeId).to.be.eq(stakePos.add(1))
      })
    })
  })

  describe('Unstaking', async () => {
    it('should not be able to unstake non owned stake', async () => {
      const personalStakeCount = await FixedSavings.personalStakeCount(
        signerAddress
      )
      const ownedStakeId = await FixedSavings.personalStakePos(
        signerAddress,
        personalStakeCount.sub(1)
      )
      const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
      expect(stakeData.account).to.not.eq(signer2Address)
      await expect(
        FixedSavings.connect(signer2).unstake(stakeData.stakeId)
      ).to.be.revertedWith('Sender not owner of the funds')
    })

    it('should not be able to unstake stake before lock', async () => {
      const personalStakeCount = await FixedSavings.personalStakeCount(
        signerAddress
      )
      const ownedStakeId = await FixedSavings.personalStakePos(
        signerAddress,
        personalStakeCount.sub(1)
      )
      const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
      const depositTime = stakeData.depositTimestamp
      await expect(
        FixedSavings.connect(signer).unstake(stakeData.stakeId)
      ).to.be.revertedWith('Not in unstaking period')

      // advance time until the end of lock period
      const expectedLockEndTime = depositTime.add(BigNumber.from(LOCK_TIME))

      // current l2 time
      const blocknum = await ethers.provider.getBlockNumber()
      const timeNow = (await ethers.provider.getBlock(blocknum)).timestamp
      // we stop before the end
      const timeToMove = expectedLockEndTime
        .sub(BigNumber.from(timeNow))
        .sub(BigNumber.from(3600))

      await moveTimeForward(timeToMove.toNumber())
      // still not in unstaking period
      await expect(
        FixedSavings.connect(signer).unstake(stakeData.stakeId)
      ).to.be.revertedWith('Not in unstaking period')
    })

    let preBalanceStaker: BigNumber
    let preXBobaBalance: BigNumber
    let preBalanceSavingsContract: BigNumber
    describe('when in unstaking period after lock', async () => {
      before(async () => {
        // transfer rewards BOBA to contract
        await L2Boba.transfer(FixedSavings.address, utils.parseEther('10'))
        const blocknum = await ethers.provider.getBlockNumber()
        const timeNow = (await ethers.provider.getBlock(blocknum)).timestamp
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        const expectedLockEndTime = stakeData.depositTimestamp.add(
          BigNumber.from(LOCK_TIME)
        )
        const timeToMove = expectedLockEndTime.sub(BigNumber.from(timeNow))
        await moveTimeForward(timeToMove.toNumber())
        preBalanceStaker = await L2Boba.balanceOf(signerAddress)
        preBalanceSavingsContract = await L2Boba.balanceOf(FixedSavings.address)
        preXBobaBalance = await xGovL2ERC20.balanceOf(signerAddress)
        await FixedSavings.unstake(stakeId)
      })

      it('should be able to unstake', async () => {
        // calculate expected rewards
        const noOfPeriods = 1 // expect to unstake after first period
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        const rewards = stakeData.depositAmount
          .mul(FLAT_INTEREST_PER_PERIOD)
          .mul(noOfPeriods)
          .div(10000)
        const postBalanceStaker = await L2Boba.balanceOf(signerAddress)
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

      it('should update the stake data', async () => {
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        expect(stakeData.isActive).to.be.eq(false)
      })

      it('should burn xBOBA for user', async () => {
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        const xBOBABalance = await xGovL2ERC20.balanceOf(signerAddress)
        expect(xBOBABalance).to.be.eq(
          preXBobaBalance.sub(stakeData.depositAmount)
        )
      })

      it('should not be able to unstake again', async () => {
        const stakeId = await FixedSavings.totalStakeCount()
        const stakeData = await FixedSavings.stakeDataMap(stakeId)
        await expect(
          FixedSavings.connect(signer).unstake(stakeData.stakeId)
        ).to.be.revertedWith('Stake is not active or already claimed')
      })
    })

    // check for two period
    describe('when unstaking after multiple periods', async () => {
      it('should not allow unstaking at lock periods', async () => {
        const personalStakeCount = await FixedSavings.personalStakeCount(
          signerAddress
        )
        const ownedStakeId = await FixedSavings.personalStakePos(
          signerAddress,
          personalStakeCount.sub(2)
        )

        const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
        const depositTime = stakeData.depositTimestamp

        const expectedLockEndTime = depositTime.add(BigNumber.from(LOCK_TIME))

        // current l2 time
        const blocknum = await ethers.provider.getBlockNumber()
        const timeNow = (await ethers.provider.getBlock(blocknum)).timestamp

        // we stop once after the unstake period ends
        const timeToMove = expectedLockEndTime
          .add(BigNumber.from(UNSTAKE_TIME))
          .sub(BigNumber.from(timeNow))

        // move time to after the first period
        // one period completed here
        await moveTimeForward(timeToMove.toNumber())
        await expect(
          FixedSavings.connect(signer).unstake(stakeData.stakeId)
        ).to.be.revertedWith('Not in unstaking period')
        // this is the start of second period
      })

      it('should be able to unstake in the unstake period after second lock', async () => {
        const personalStakeCount = await FixedSavings.personalStakeCount(
          signerAddress
        )
        const ownedStakeId = await FixedSavings.personalStakePos(
          signerAddress,
          personalStakeCount.sub(2)
        )

        const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
        const depositTime = stakeData.depositTimestamp

        const expectedLockEndTimeSecondPeriod = depositTime
          .add(BigNumber.from(LOCK_TIME))
          .add(BigNumber.from(UNSTAKE_TIME))
          .add(BigNumber.from(LOCK_TIME))

        // current l2 time
        const blocknum = await ethers.provider.getBlockNumber()
        const timeNow = (await ethers.provider.getBlock(blocknum)).timestamp

        // we stop after the second lock period ends
        const timeToMove = expectedLockEndTimeSecondPeriod.sub(
          BigNumber.from(timeNow)
        )
        await moveTimeForward(timeToMove.toNumber())

        const BalanceStakerBeforeUnstake = await L2Boba.balanceOf(signerAddress)
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

        const postBalanceStaker = await L2Boba.balanceOf(signerAddress)
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
        expect(await xGovL2ERC20.balanceOf(signerAddress)).to.be.eq(0)
        await expect(
          FixedSavings.connect(signer).unstake(stakeData.stakeId)
        ).to.be.revertedWith('Stake is not active or already claimed')
      })
    })

    // check for stopped period
    describe('when unstaking after contract interest is closed', async () => {
      it('should not allow non owner to stop the interest bearing contract', async () => {
        await expect(
          FixedSavings.connect(signer2).stopStakingContract()
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should allow owner to stop the interest bearing contract', async () => {
        // move time to account for one more period first
        const personalStakeCount = await FixedSavings.personalStakeCount(
          signer2Address
        )
        const ownedStakeId = await FixedSavings.personalStakePos(
          signer2Address,
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
        const blocknum = await ethers.provider.getBlockNumber()
        const timeNow = (await ethers.provider.getBlock(blocknum)).timestamp

        // we stop after the second lock period ends
        const timeToMove = expectedLockEndTimeSecondPeriod.sub(
          BigNumber.from(timeNow)
        )

        await moveTimeForward(timeToMove.toNumber())

        expect(await FixedSavings.owner()).to.be.eq(signerAddress)
        await FixedSavings.connect(signer).stopStakingContract()
        const blocknumAfterStop = await ethers.provider.getBlockNumber()
        const timeNowAfterStop = (
          await ethers.provider.getBlock(blocknumAfterStop)
        ).timestamp
        const stopTime = await FixedSavings.stakingCloseTimestamp()
        expect(stopTime).to.not.eq(0)
        expect(stopTime).to.be.eq(timeNowAfterStop)
      }).timeout(100000)

      it('should not allow to restop interest bearing contract', async () => {
        await expect(
          FixedSavings.connect(signer).stopStakingContract()
        ).to.be.revertedWith('Already closed')
      })

      it('should not allow new stakes after stopping contract', async () => {
        await L2Boba.connect(signer).approve(FixedSavings.address, 100)
        await expect(
          FixedSavings.connect(signer).stake(100)
        ).to.be.revertedWith('Staking contract is closed')
      })

      it('should give out rewards until the contract was stopped', async () => {
        const personalStakeCount = await FixedSavings.personalStakeCount(
          signer2Address
        )
        const ownedStakeId = await FixedSavings.personalStakePos(
          signer2Address,
          personalStakeCount.sub(1)
        )

        const stakeData = await FixedSavings.stakeDataMap(ownedStakeId)
        const depositTime = stakeData.depositTimestamp

        const expectedLockEndTimeFourPeriod = depositTime
          .add(BigNumber.from(LOCK_TIME * 4))
          .add(BigNumber.from(UNSTAKE_TIME * 3))

        // current l2 time
        const blocknum = await ethers.provider.getBlockNumber()
        const timeNow = (await ethers.provider.getBlock(blocknum)).timestamp

        // we stop after the second lock period ends
        const timeToMove = expectedLockEndTimeFourPeriod.sub(
          BigNumber.from(timeNow)
        )

        await moveTimeForward(timeToMove.toNumber())

        const BalanceStakerBeforeUnstake = await L2Boba.balanceOf(
          signer2Address
        )
        const BalanceSavingsContractBeforeUnstake = await L2Boba.balanceOf(
          FixedSavings.address
        )

        await FixedSavings.connect(signer2).unstake(stakeData.stakeId)

        // no of period is four now, but contract stopped in the third period
        const noOfPeriods = 3 //
        const rewards = stakeData.depositAmount
          .mul(FLAT_INTEREST_PER_PERIOD)
          .mul(noOfPeriods)
          .div(10000)

        const postBalanceStaker = await L2Boba.balanceOf(signer2Address)
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
      })
    })
  })
})
