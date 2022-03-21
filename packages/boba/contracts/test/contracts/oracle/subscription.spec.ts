/* External Imports */
import { ethers } from 'hardhat'
import { Signer, Contract, BigNumber } from 'ethers'
import { expect } from '../../setup'

const BOBA_SUPPLY = ethers.utils.parseEther('10000')
const BOBA_DECIMALS = 18
const COST_LOCAL_ACCESS = ethers.utils.parseEther('1') // per second
const COST_GLOBAL_ACCESS = ethers.utils.parseEther('2') // per second
const MIN_SUBSCRIPTION_PERIOD = 5 // seconds

const TEST_BASE = '0x4200000000000000000000000000000000000006'
const TEST_QUOTE = '0x0000000000000000000000000000000000000348'

let Subscription: Contract
let bobaToken: Contract
const deployBoba = async (): Promise<Contract> => {
  return (await ethers.getContractFactory('L1ERC20')).deploy(
    BOBA_SUPPLY,
    'BOBA',
    'BOBA',
    BOBA_DECIMALS
  )
}
const deploySubscription = async (
  bobaTokenAddress: string
): Promise<Contract> => {
  return (await ethers.getContractFactory('Subscription')).deploy(
    bobaTokenAddress,
    COST_LOCAL_ACCESS,
    COST_GLOBAL_ACCESS,
    MIN_SUBSCRIPTION_PERIOD
  )
}

const getSampleData = async (base: string, quote: string): Promise<string> => {
  // only to populate
  const signer: Signer = (await ethers.getSigners())[0]
  const FeedRegistry = new Contract(
    ethers.constants.AddressZero,
    (await ethers.getContractFactory('FeedRegistry')).interface,
    signer
  )

  return (await FeedRegistry.populateTransaction.latestAnswer(base, quote)).data
}

describe('Oracle Subscription Tests', () => {
  beforeEach(async () => {
    bobaToken = await deployBoba()
  })

  describe('Payment Parameters', () => {
    it('boba token cannot be zero address', async () => {
      await expect(
        deploySubscription(ethers.constants.AddressZero)
      ).to.be.revertedWith('zero address not allowed')
    })

    it('should set initial parameters', async () => {
      Subscription = await deploySubscription(bobaToken.address)
      expect(await Subscription.paymentPerSecondLocalAccess()).to.be.equal(
        COST_LOCAL_ACCESS
      )
      expect(await Subscription.paymentPerSecondGlobalAccess()).to.be.equal(
        COST_GLOBAL_ACCESS
      )
      expect(await Subscription.minSubscriptionPeriod()).to.be.equal(
        MIN_SUBSCRIPTION_PERIOD
      )
      expect(await Subscription.bobaTokenAddress()).to.be.equal(
        bobaToken.address
      )
    })

    it('should not allow setting zero minimum subscription', async () => {
      Subscription = await deploySubscription(bobaToken.address)
      await expect(
        Subscription.updateSubscriptionCost(
          COST_LOCAL_ACCESS,
          COST_GLOBAL_ACCESS,
          0
        )
      ).to.be.revertedWith('min subscription cannot be zero')
    })

    it('should not allow non-owner to update payment parameters', async () => {
      Subscription = await deploySubscription(bobaToken.address)
      const UPDATED_COST_LOCAL_ACCESS = COST_LOCAL_ACCESS.add(
        ethers.utils.parseEther('1')
      )
      const UPDATED_COST_GLOBAL_ACCESS = COST_GLOBAL_ACCESS.add(
        ethers.utils.parseEther('1')
      )
      const UPDATED_MIN_SUBSCRIPTION_PERIOD = MIN_SUBSCRIPTION_PERIOD + 100
      const signer: Signer = (await ethers.getSigners())[1]
      await expect(
        Subscription.connect(signer).updateSubscriptionCost(
          UPDATED_COST_LOCAL_ACCESS,
          UPDATED_COST_GLOBAL_ACCESS,
          UPDATED_MIN_SUBSCRIPTION_PERIOD
        )
      ).to.be.revertedWith('Only callable by owner')
    })

    it('should allow owner to updating payment parameters', async () => {
      Subscription = await deploySubscription(bobaToken.address)
      const UPDATED_COST_LOCAL_ACCESS = COST_LOCAL_ACCESS.add(
        ethers.utils.parseEther('1')
      )
      const UPDATED_COST_GLOBAL_ACCESS = COST_GLOBAL_ACCESS.add(
        ethers.utils.parseEther('1')
      )
      const UPDATED_MIN_SUBSCRIPTION_PERIOD = MIN_SUBSCRIPTION_PERIOD + 100

      await Subscription.updateSubscriptionCost(
        UPDATED_COST_LOCAL_ACCESS,
        UPDATED_COST_GLOBAL_ACCESS,
        UPDATED_MIN_SUBSCRIPTION_PERIOD
      )

      expect(await Subscription.paymentPerSecondLocalAccess()).to.be.equal(
        UPDATED_COST_LOCAL_ACCESS
      )
      expect(await Subscription.paymentPerSecondGlobalAccess()).to.be.equal(
        UPDATED_COST_GLOBAL_ACCESS
      )
      expect(await Subscription.minSubscriptionPeriod()).to.be.equal(
        UPDATED_MIN_SUBSCRIPTION_PERIOD
      )
    })
  })

  describe('Local Access', () => {
    beforeEach(async () => {
      Subscription = await deploySubscription(bobaToken.address)
    })

    it('should not allow access for period lower than min', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD - 1

      //approve token to pay
      await bobaToken.approve(
        Subscription.address,
        ethers.utils.parseEther('100')
      )
      await expect(
        Subscription.subscribeLocalAccess(
          await signer.getAddress(),
          sampleData,
          subscriptionPeriod
        )
      ).to.be.revertedWith('Subscription period below minimum')
    })

    it('should not allow access if token transfer fails', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD

      const requiredToken = (
        await Subscription.paymentPerSecondLocalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken.sub(1))

      await expect(
        Subscription.subscribeLocalAccess(
          await signer.getAddress(),
          sampleData,
          subscriptionPeriod
        )
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })

    it('should be able to subscribe for local access', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )

      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD

      const requiredToken = (
        await Subscription.paymentPerSecondLocalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      const subscriptionBalancePrior = await bobaToken.balanceOf(
        Subscription.address
      )

      // call with second signer, to mock a call from a contract (non EOA)
      const signer2: Signer = (await ethers.getSigners())[1]
      const accessStatusPrior = await Subscription.connect(signer2).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusPrior).to.be.equal(false)

      await Subscription.subscribeLocalAccess(
        await signer.getAddress(),
        sampleData,
        subscriptionPeriod
      )

      const subscriptionBalancePost = await bobaToken.balanceOf(
        Subscription.address
      )
      expect(subscriptionBalancePost).to.be.equal(
        subscriptionBalancePrior.add(requiredToken)
      )

      const accessStatus = await Subscription.connect(signer2).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatus).to.be.equal(true)
    })
  })

  describe('Local Access - Access Expiry', () => {
    beforeEach(async () => {
      Subscription = await deploySubscription(bobaToken.address)
    })

    it('should set expiry time correctly for fresh subscriber', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )

      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondLocalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeLocalAccess(
        await signer.getAddress(),
        sampleData,
        subscriptionPeriod
      )

      const currentExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )

      expect(currentExpiry).to.be.equal(
        BigNumber.from(
          (await ethers.provider.getBlock('latest')).timestamp
        ).add(subscriptionPeriod)
      )
    })

    it('should set expiry time correctly for active subscriber', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )

      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondLocalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeLocalAccess(
        await signer.getAddress(),
        sampleData,
        subscriptionPeriod
      )

      const firstExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )
      expect(firstExpiry).to.be.equal(
        BigNumber.from(
          (await ethers.provider.getBlock('latest')).timestamp
        ).add(subscriptionPeriod)
      )

      // move time but not until expiry
      await ethers.provider.send('evm_increaseTime', [subscriptionPeriod / 2])
      await ethers.provider.send('evm_mine', [])

      // subscribe for one more subscriptionPeriod from the current time
      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeLocalAccess(
        await signer.getAddress(),
        sampleData,
        subscriptionPeriod
      )

      const currentExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )
      expect(currentExpiry).to.be.equal(firstExpiry.add(subscriptionPeriod))
    })

    it('should set expiry time correctly for inactive past subscriber', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )

      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondLocalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeLocalAccess(
        await signer.getAddress(),
        sampleData,
        subscriptionPeriod
      )

      const firstExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )

      expect(firstExpiry).to.be.equal(
        BigNumber.from(
          (await ethers.provider.getBlock('latest')).timestamp
        ).add(subscriptionPeriod)
      )

      // move time until after expiry
      await ethers.provider.send('evm_increaseTime', [subscriptionPeriod * 2])
      await ethers.provider.send('evm_mine', [])

      // subscribe for one subscriptionPeriod from the current time
      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeLocalAccess(
        await signer.getAddress(),
        sampleData,
        subscriptionPeriod
      )

      const currentExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )

      expect(currentExpiry).to.not.be.equal(firstExpiry.add(subscriptionPeriod))
      expect(currentExpiry).to.be.equal(
        BigNumber.from(
          (await ethers.provider.getBlock('latest')).timestamp
        ).add(subscriptionPeriod)
      )
    })

    it('should prevent access after expiry', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )

      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondLocalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      // call with second signer, to mock a call from a contract (non EOA)
      const signer2: Signer = (await ethers.getSigners())[1]
      const accessStatusPrior = await Subscription.connect(signer2).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusPrior).to.be.equal(false)

      await Subscription.subscribeLocalAccess(
        await signer.getAddress(),
        sampleData,
        subscriptionPeriod
      )

      const accessStatusPost = await Subscription.connect(signer2).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusPost).to.be.equal(true)

      // move time until after expiry
      await ethers.provider.send('evm_increaseTime', [subscriptionPeriod + 1])
      await ethers.provider.send('evm_mine', [])

      const accessStatusPostTimeout = await Subscription.connect(
        signer2
      ).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusPostTimeout).to.be.equal(false)
    })
  })

  describe('Global Access', () => {
    beforeEach(async () => {
      Subscription = await deploySubscription(bobaToken.address)
    })

    it('should not allow access for period lower than min', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD - 1

      //approve token to pay
      await bobaToken.approve(
        Subscription.address,
        ethers.utils.parseEther('100')
      )
      await expect(
        Subscription.subscribeGlobalAccess(
          await signer.getAddress(),
          subscriptionPeriod
        )
      ).to.be.revertedWith('Subscription period below minimum')
    })

    it('should not allow access if token transfer fails', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD

      const requiredToken = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken.sub(1))

      await expect(
        Subscription.subscribeGlobalAccess(
          await signer.getAddress(),
          subscriptionPeriod
        )
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })

    it('should be able to subscribe for global access', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD

      const requiredToken = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      const subscriptionBalancePrior = await bobaToken.balanceOf(
        Subscription.address
      )

      // call with second signer, to mock a call from a contract (non EOA)
      const signer2: Signer = (await ethers.getSigners())[1]
      const accessStatusPrior = await Subscription.connect(signer2).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusPrior).to.be.equal(false)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const subscriptionBalancePost = await bobaToken.balanceOf(
        Subscription.address
      )
      expect(subscriptionBalancePost).to.be.equal(
        subscriptionBalancePrior.add(requiredToken)
      )

      const accessStatus = await Subscription.connect(signer2).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatus).to.be.equal(true)
    })
  })

  describe('Global Access - Access Expiry', () => {
    beforeEach(async () => {
      Subscription = await deploySubscription(bobaToken.address)
    })

    it('should set expiry time correctly for fresh subscriber', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const currentExpiry = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )

      expect(currentExpiry).to.be.equal(
        BigNumber.from(
          (await ethers.provider.getBlock('latest')).timestamp
        ).add(subscriptionPeriod)
      )
    })

    it('should set expiry time correctly for active subscriber', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const firstExpiry = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )
      expect(firstExpiry).to.be.equal(
        BigNumber.from(
          (await ethers.provider.getBlock('latest')).timestamp
        ).add(subscriptionPeriod)
      )

      // move time but not until expiry
      await ethers.provider.send('evm_increaseTime', [subscriptionPeriod / 2])
      await ethers.provider.send('evm_mine', [])

      // subscribe for one more subscriptionPeriod from the current time
      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const currentExpiry = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )
      expect(currentExpiry).to.be.equal(firstExpiry.add(subscriptionPeriod))
    })

    it('should set expiry time correctly for inactive past subscriber', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const firstExpiry = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )

      expect(firstExpiry).to.be.equal(
        BigNumber.from(
          (await ethers.provider.getBlock('latest')).timestamp
        ).add(subscriptionPeriod)
      )

      // move time until after expiry
      await ethers.provider.send('evm_increaseTime', [subscriptionPeriod * 2])
      await ethers.provider.send('evm_mine', [])

      // subscribe for one subscriptionPeriod from the current time
      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const currentExpiry = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )

      expect(currentExpiry).to.not.be.equal(firstExpiry.add(subscriptionPeriod))
      expect(currentExpiry).to.be.equal(
        BigNumber.from(
          (await ethers.provider.getBlock('latest')).timestamp
        ).add(subscriptionPeriod)
      )
    })

    it('should prevent access after expiry', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      // call with second signer, to mock a call from a contract (non EOA)
      const signer2: Signer = (await ethers.getSigners())[1]
      const accessStatusPrior = await Subscription.connect(signer2).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusPrior).to.be.equal(false)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const accessStatusPost = await Subscription.connect(signer2).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusPost).to.be.equal(true)

      // move time until after expiry
      await ethers.provider.send('evm_increaseTime', [subscriptionPeriod + 1])
      await ethers.provider.send('evm_mine', [])

      const accessStatusPostTimeout = await Subscription.connect(
        signer2
      ).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusPostTimeout).to.be.equal(false)
    })
  })

  describe('Multiple Access', () => {
    beforeEach(async () => {
      Subscription = await deploySubscription(bobaToken.address)
    })

    it('Global acccess should override Local acess', async () => {
      // multiple subscription
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )

      const subscriptionPeriodLocal = MIN_SUBSCRIPTION_PERIOD * 10
      const subscriptionPeriodGlobal = MIN_SUBSCRIPTION_PERIOD * 5

      const requiredToken = (
        await Subscription.paymentPerSecondLocalAccess()
      ).mul(subscriptionPeriodLocal)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeLocalAccess(
        await signer.getAddress(),
        sampleData,
        subscriptionPeriodLocal
      )

      const requiredTokenGlobalAccess = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriodGlobal)
      await bobaToken.approve(Subscription.address, requiredTokenGlobalAccess)
      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriodGlobal
      )
      const currentGlobalExpiry = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )

      // call with second signer, to mock a call from a contract (non EOA)
      const signer2: Signer = (await ethers.getSigners())[1]
      const accessStatusFirstPair = await Subscription.connect(
        signer2
      ).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusFirstPair).to.be.equal(true)

      // pair without local access
      const dummyBase = ethers.utils.getAddress('0x' + 'abba'.repeat(10))
      const accessStatusSecondPair = await Subscription.connect(
        signer2
      ).hasAccess(
        await signer.getAddress(),
        await getSampleData(dummyBase, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusSecondPair).to.be.equal(true)

      // move time until global expiry
      await ethers.provider.send('evm_setNextBlockTimestamp', [
        currentGlobalExpiry.add(1).toNumber(),
      ])
      await ethers.provider.send('evm_mine', [])

      // local access still valid
      const accessStatusFirstPairLatest = await Subscription.connect(
        signer2
      ).hasAccess(
        await signer.getAddress(),
        await getSampleData(TEST_BASE, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusFirstPairLatest).to.be.equal(true)

      // pair without local access
      const accessStatusSecondPairLatest = await Subscription.connect(
        signer2
      ).hasAccess(
        await signer.getAddress(),
        await getSampleData(dummyBase, TEST_QUOTE) //data in form of FeedRegistry
      )
      expect(accessStatusSecondPairLatest).to.be.equal(false)
    })
  })

  describe('Owner Permissions', () => {
    beforeEach(async () => {
      Subscription = await deploySubscription(bobaToken.address)
    })

    it('should not allow non owner to increase expiry time', async () => {
      // non-owner
      const signer: Signer = (await ethers.getSigners())[1]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD
      const dummyExpiryTime = 100

      await expect(
        Subscription.connect(signer).addLocalAccess(
          await signer.getAddress(),
          sampleData,
          dummyExpiryTime
        )
      ).to.be.revertedWith('Only callable by owner')

      await expect(
        Subscription.connect(signer).addGlobalAccess(
          await signer.getAddress(),
          dummyExpiryTime
        )
      ).to.be.revertedWith('Only callable by owner')
    })

    it('should allow only the owner to increase expiry time', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )

      const dummyExpiryTime = BigNumber.from(
        (await ethers.provider.getBlock('latest')).timestamp
      ).add(MIN_SUBSCRIPTION_PERIOD)

      // local access
      await Subscription.connect(signer).addLocalAccess(
        await signer.getAddress(),
        sampleData,
        dummyExpiryTime
      )

      const currentExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )
      expect(currentExpiry).to.be.equal(dummyExpiryTime)

      const updatedExpiryTime = currentExpiry.add(MIN_SUBSCRIPTION_PERIOD)
      await Subscription.connect(signer).addLocalAccess(
        await signer.getAddress(),
        sampleData,
        updatedExpiryTime
      )

      const updatedExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )
      expect(updatedExpiry).to.be.equal(updatedExpiryTime)

      // global access
      const dummyExpiryTimeGlobal = BigNumber.from(
        (await ethers.provider.getBlock('latest')).timestamp
      ).add(MIN_SUBSCRIPTION_PERIOD)

      await Subscription.connect(signer).addGlobalAccess(
        await signer.getAddress(),
        dummyExpiryTimeGlobal
      )

      const currentExpiryGlobal = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )
      expect(currentExpiryGlobal).to.be.equal(dummyExpiryTimeGlobal)

      const updatedExpiryTimeGlobal = currentExpiryGlobal.add(
        MIN_SUBSCRIPTION_PERIOD
      )
      await Subscription.connect(signer).addGlobalAccess(
        await signer.getAddress(),
        updatedExpiryTimeGlobal
      )

      const updatedExpiryGlobal = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )
      expect(updatedExpiryGlobal).to.be.equal(updatedExpiryTimeGlobal)
    })

    it('should not allow the owner to decrease expiry time', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const sampleData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [TEST_BASE, TEST_QUOTE]
      )

      const dummyExpiryTime = BigNumber.from(
        (await ethers.provider.getBlock('latest')).timestamp
      ).add(MIN_SUBSCRIPTION_PERIOD)

      // local access
      await Subscription.connect(signer).addLocalAccess(
        await signer.getAddress(),
        sampleData,
        dummyExpiryTime
      )

      const currentExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )
      expect(currentExpiry).to.be.equal(dummyExpiryTime)

      const updatedExpiryTime = currentExpiry.sub(1)
      await Subscription.connect(signer).addLocalAccess(
        await signer.getAddress(),
        sampleData,
        updatedExpiryTime
      )

      const updatedExpiry = await Subscription.s_localAccessList(
        await signer.getAddress(),
        sampleData
      )
      expect(updatedExpiry).to.be.not.equal(updatedExpiryTime)
      // stays same
      expect(updatedExpiry).to.be.equal(currentExpiry)

      // global access
      const dummyExpiryTimeGlobal = BigNumber.from(
        (await ethers.provider.getBlock('latest')).timestamp
      ).add(MIN_SUBSCRIPTION_PERIOD)

      await Subscription.connect(signer).addGlobalAccess(
        await signer.getAddress(),
        dummyExpiryTimeGlobal
      )

      const currentExpiryGlobal = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )
      expect(currentExpiryGlobal).to.be.equal(dummyExpiryTimeGlobal)

      const updatedExpiryTimeGlobal = currentExpiryGlobal.sub(1)
      await Subscription.connect(signer).addGlobalAccess(
        await signer.getAddress(),
        updatedExpiryTimeGlobal
      )

      const updatedExpiryGlobal = await Subscription.s_globalAccessList(
        await signer.getAddress()
      )
      expect(updatedExpiryGlobal).to.not.be.equal(updatedExpiryTimeGlobal)
      // stays same
      expect(updatedExpiryGlobal).to.be.equal(currentExpiryGlobal)
    })

    it('should allow owner to withdraw contract funds', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD

      const requiredToken = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const subscriptionBalance = await bobaToken.balanceOf(
        Subscription.address
      )

      const recipientBalancePrior = await bobaToken.balanceOf(
        await signer.getAddress()
      )

      await Subscription.withdrawFunds(
        await signer.getAddress(),
        subscriptionBalance
      )

      const recipientBalancePost = await bobaToken.balanceOf(
        await signer.getAddress()
      )
      expect(recipientBalancePost).to.be.equal(
        recipientBalancePrior.add(subscriptionBalance)
      )
      expect(await bobaToken.balanceOf(Subscription.address)).to.be.equal(0)
    })

    it('should not allow non owner to withdraw contract funds', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const subscriptionPeriod = MIN_SUBSCRIPTION_PERIOD

      const requiredToken = (
        await Subscription.paymentPerSecondGlobalAccess()
      ).mul(subscriptionPeriod)

      await bobaToken.approve(Subscription.address, requiredToken)

      await Subscription.subscribeGlobalAccess(
        await signer.getAddress(),
        subscriptionPeriod
      )

      const subscriptionBalance = await bobaToken.balanceOf(
        Subscription.address
      )

      const signer2: Signer = (await ethers.getSigners())[1]
      await expect(
        Subscription.connect(signer2).withdrawFunds(
          await signer.getAddress(),
          subscriptionBalance
        )
      ).to.be.revertedWith('Only callable by owner')
    })
  })
})
