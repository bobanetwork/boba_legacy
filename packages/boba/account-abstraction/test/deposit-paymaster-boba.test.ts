import './aa.init'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  SimpleAccount,
  EntryPoint,
  BobaDepositPaymaster,
  BobaDepositPaymaster__factory,
  TestCounter,
  TestCounter__factory,
  TestToken,
  TestToken__factory,
  MockFeedRegistry__factory,
  MockFeedRegistry,
  TestTokenValueBobaDepositPaymaster__factory,
  TestTokenValueBobaDepositPaymaster
} from '../typechain'
import {
  AddressZero, createAddress,
  createAccountOwner,
  deployEntryPoint, FIVE_ETH, ONE_ETH, simulationResultCatch, userOpsWithoutAgg, createAccount
} from './testutils'
import { fillAndSign } from './UserOp'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'
import {BigNumber} from "ethers";

describe('BobaDepositPaymaster', () => {
  let entryPoint: EntryPoint
  const ethersSigner = ethers.provider.getSigner()
  let token: TestToken
  let ethOracle: MockFeedRegistry
  let paymaster: BobaDepositPaymaster
  before(async function () {
    entryPoint = await deployEntryPoint()

    // deploy ethOracle
    ethOracle = await new MockFeedRegistry__factory(ethersSigner).deploy()

    paymaster = await new BobaDepositPaymaster__factory(ethersSigner).deploy(entryPoint.address, ethOracle.address)
    await paymaster.addStake(1, { value: parseEther('2') })
    await entryPoint.depositTo(paymaster.address, { value: parseEther('1') })

    token = await new TestToken__factory(ethersSigner).deploy()
    // add boba token
    await paymaster.addToken(token.address, ethOracle.address, token.address, 18)

    await token.mint(await ethersSigner.getAddress(), FIVE_ETH)
    await token.approve(paymaster.address, ethers.constants.MaxUint256)
  })

  describe('ethOracle', () => {
    it('should set native token oracle and base', async () => {
      const nativeTokenAddress = await paymaster.L2_ETH_ADDRESS()
      const nativeTokenOracle = await paymaster.oracles(nativeTokenAddress)
      expect(nativeTokenOracle.feedRegistry).to.eq(ethOracle.address)
      expect(nativeTokenOracle.tokenBase).to.eq(nativeTokenAddress)
    })
    it('should not allow incorrect native token oracle', async () => {
      await expect(new BobaDepositPaymaster__factory(ethersSigner).deploy(entryPoint.address, ethers.constants.AddressZero)).to.be.revertedWith('DepositPaymaster: Incorrect eth oracle')
    })
  })

  describe('addToken', () => {
    it('should not allow incorrect token oracle', async () => {
      await expect(paymaster.addToken(token.address, ethers.constants.AddressZero, token.address, 18)).to.be.revertedWith('DepositPaymaster: Incorrect token oracle')
    })
  })

  describe('deposit', () => {
    let account: SimpleAccount

    before(async () => {
      ({ proxy: account } = await createAccount(ethersSigner, await ethersSigner.getAddress(), entryPoint.address))
    })
    it('should deposit and read balance', async () => {
      await paymaster.addDepositFor(token.address, account.address, 100)
      expect(await paymaster.depositInfo(token.address, account.address)).to.eql({ amount: 100 })
    })
    it('should fail to deposit native token', async () => {
      const nativeTokenAddress = await paymaster.L2_ETH_ADDRESS()
      await expect(paymaster.addDepositFor(nativeTokenAddress, account.address, 100)).to.be.reverted
    })
    it('should fail to withdraw without unlock', async () => {
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(token.address, AddressZero, 1).then(tx => tx.data!)

      await expect(
        account.execute(paymaster.address, 0, paymasterWithdraw)
      ).to.revertedWith('DepositPaymaster: must unlockTokenDeposit')
    })
    it('should fail to withdraw within the same block ', async () => {
      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(token.address, AddressZero, 1).then(tx => tx.data!)

      await expect(
        account.executeBatch([paymaster.address, paymaster.address], [paymasterUnlock, paymasterWithdraw])
      ).to.be.revertedWith('DepositPaymaster: must unlockTokenDeposit')
    })
    it('should succeed to withdraw after unlock', async () => {
      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      const target = createAddress()
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(token.address, target, 1).then(tx => tx.data!)
      await account.execute(paymaster.address, 0, paymasterUnlock)
      await account.execute(paymaster.address, 0, paymasterWithdraw)
      expect(await token.balanceOf(target)).to.eq(1)
    })
  })

  describe('#validatePaymasterUserOp', () => {
    let account: SimpleAccount
    const gasPrice = 1e9

    before(async () => {
      ({ proxy: account } = await createAccount(ethersSigner, await ethersSigner.getAddress(), entryPoint.address))
    })

    it('should fail if no token', async () => {
      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: paymaster.address
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp)).to.be.revertedWith('paymasterAndData must specify token')
    })

    it('should fail with wrong token', async () => {
      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad('0x1234', 20)])
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('DepositPaymaster: unsupported token')
    })

    it('should reject if no deposit', async () => {
      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('DepositPaymaster: deposit too low')
    })

    it('should reject if deposit is not locked', async () => {
      await paymaster.addDepositFor(token.address, account.address, ONE_ETH)

      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      await account.execute(paymaster.address, 0, paymasterUnlock)

      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('not locked')
    })

    it('succeed with valid deposit', async () => {
      // needed only if previous test did unlock.
      const paymasterLockTokenDeposit = await paymaster.populateTransaction.lockTokenDeposit().then(tx => tx.data!)
      await account.execute(paymaster.address, 0, paymasterLockTokenDeposit)

      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
      }, ethersSigner, entryPoint)
      await entryPoint.callStatic.simulateValidation(userOp).catch(simulationResultCatch)
    })
  })

  describe('#handleOps', () => {
    let account: SimpleAccount
    const accountOwner = createAccountOwner()
    let counter: TestCounter
    let callData: string
    before(async () => {
      ({ proxy: account } = await createAccount(ethersSigner, await accountOwner.getAddress(), entryPoint.address))
      counter = await new TestCounter__factory(ethersSigner).deploy()
      const counterJustEmit = await counter.populateTransaction.justemit().then(tx => tx.data!)
      callData = await account.populateTransaction.execute(counter.address, 0, counterJustEmit).then(tx => tx.data!)

      await paymaster.addDepositFor(token.address, account.address, ONE_ETH)
    })
    it('should pay with deposit (and revert user\'s call) if user can\'t pay with tokens', async () => {
      const beneficiary = createAddress()
      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
        callData
      }, accountOwner, entryPoint)

      await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp]), beneficiary)

      const [log] = await entryPoint.queryFilter(entryPoint.filters.UserOperationEvent())
      expect(log.args.success).to.eq(false)
      expect(await counter.queryFilter(counter.filters.CalledFrom())).to.eql([])
      expect(await ethers.provider.getBalance(beneficiary)).to.be.gt(0)
    })

    it('should pay with tokens if available', async () => {
      const beneficiary = createAddress()
      const beneficiary1 = createAddress()
      const initialTokens = parseEther('1')
      await token.mint(account.address, initialTokens)

      // need to "approve" the paymaster to use the tokens. we issue a UserOp for that (which uses the deposit to execute)
      const tokenApprovePaymaster = await token.populateTransaction.approve(paymaster.address, ethers.constants.MaxUint256).then(tx => tx.data!)
      const execApprove = await account.populateTransaction.execute(token.address, 0, tokenApprovePaymaster).then(tx => tx.data!)
      const userOp1 = await fillAndSign({
        sender: account.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
        callData: execApprove
      }, accountOwner, entryPoint)
      await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp1]), beneficiary1)

      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
        callData
      }, accountOwner, entryPoint)
      await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp]), beneficiary)

      const [log] = await entryPoint.queryFilter(entryPoint.filters.UserOperationEvent(), await ethers.provider.getBlockNumber())
      expect(log.args.success).to.eq(true)
      const charge = log.args.actualGasCost
      expect(await ethers.provider.getBalance(beneficiary)).to.eq(charge)

      const targetLogs = await counter.queryFilter(counter.filters.CalledFrom())
      expect(targetLogs.length).to.eq(1)
    })
  })
  describe('getTokenValueOfEth', () => {
    let bobaDepositPaymaster: TestTokenValueBobaDepositPaymaster
    let testEthOracle: MockFeedRegistry
    let testTokenOracle: MockFeedRegistry
    let tokenAlt: TestToken
    before(async () => {
      testEthOracle = await new MockFeedRegistry__factory(ethersSigner).deploy()
      testTokenOracle = await new MockFeedRegistry__factory(ethersSigner).deploy()

      bobaDepositPaymaster = await new TestTokenValueBobaDepositPaymaster__factory(ethersSigner).deploy(entryPoint.address, testEthOracle.address)
      // add boba token
      await bobaDepositPaymaster.addToken(token.address, testTokenOracle.address, token.address, 18)
    })
    it('should return correct conversion', async () => {
      const ethBoughtAmount = ethers.utils.parseEther('1')
      const requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(token.address, ethBoughtAmount)
      // oracle returns 1:1 conversion
      expect(requiredTokens).to.be.eq(ethBoughtAmount)
    })

    it('should fail for invalid roundId', async () => {
      const prevRoundId = await testEthOracle.fixedRoundId()
      await testEthOracle.updateFixedRoundId(0)

      const ethBoughtAmount = ethers.utils.parseEther('1')
      await expect(bobaDepositPaymaster.getTokenValueOfEthTest(token.address, ethBoughtAmount)).to.be.revertedWith("ETH round failed")

      await testEthOracle.updateFixedRoundId(prevRoundId)
    })

    it('should fail when last update from oracle was too long ago', async () => {
      // see constant in BobaDepositPaymaster for current expiration value
      const maxAgeUpdatedAt = await bobaDepositPaymaster.MAX_AGE_ASSET_PRICE()
      const currBlockTimeStamp = BigNumber.from((await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp);

      const prevUpdatedAt = await testEthOracle.fixedUpdatedAt()
      await testEthOracle.updateFixedUpdatedAt(currBlockTimeStamp.sub(maxAgeUpdatedAt))

      const ethBoughtAmount = ethers.utils.parseEther('1')
      await expect(bobaDepositPaymaster.getTokenValueOfEthTest(token.address, ethBoughtAmount)).to.be.revertedWith("ETH price expired")

      await testEthOracle.updateFixedUpdatedAt(prevUpdatedAt)
    })

    it('should return correct conversion on different values', async () => {
      // set eth price
      await testEthOracle.updateFixedReturnValue(125475500000)
      // set token price
      // example boba
      await testTokenOracle.updateFixedReturnValue(21612500)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(token.address, ethBoughtAmount)
      // required Tokens should be approx. 5805.69 as per the exchange value
      expect(requiredTokens).to.be.eq('5805691150954308849045')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(token.address, ethBoughtAmount)
      // required Tokens should be approx. 2.90 as per the exchange value
      expect(requiredTokens).to.be.eq('2902845575477154424')
    })
    it('should return correct conversion on different token decimals', async () => {
      tokenAlt = await new TestToken__factory(ethersSigner).deploy()
      await tokenAlt.setDecimals(6)

      await bobaDepositPaymaster.addToken(tokenAlt.address, testTokenOracle.address, tokenAlt.address, 6)
      // set eth price
      await testEthOracle.updateFixedReturnValue(125475500000)
      // set token price
      // example usdc, adjust decimals
      await testTokenOracle.updateFixedReturnValue(100000000)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 1254.75 as per the exchange value
      expect(requiredTokens).to.be.eq('1254755000')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 0.62 as per the exchange value
      expect(requiredTokens).to.be.eq('627377')
    })
    it('should return correct conversion on different price oracle decimals', async () => {
      // set eth price
      await testEthOracle.updateFixedReturnValue(125475500000)
      // set token price
      // example boba
      await testTokenOracle.updateDecimals(6)
      // decimal 6
      await testTokenOracle.updateFixedReturnValue(216125)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(token.address, ethBoughtAmount)
      // required Tokens should be approx. 5805.69 as per the exchange value
      expect(requiredTokens).to.be.eq('5805691150954308849045')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(token.address, ethBoughtAmount)
      // required Tokens should be approx. 2.90 as per the exchange value
      expect(requiredTokens).to.be.eq('2902845575477154424')

      await testTokenOracle.updateDecimals(8)
    })
    it('should return correct conversion on different token and price oracle decimals', async () => {
      tokenAlt = await new TestToken__factory(ethersSigner).deploy()
      await tokenAlt.setDecimals(6)
      await testTokenOracle.updateDecimals(6)
      await bobaDepositPaymaster.addToken(tokenAlt.address, testTokenOracle.address, tokenAlt.address, 6)
      // set eth price
      await testEthOracle.updateFixedReturnValue(125475500000)
      // set token price
      // example usdc, adjust priceOracle decimals to 6
      await testTokenOracle.updateFixedReturnValue(1000000)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 1254.75 as per the exchange value
      expect(requiredTokens).to.be.eq('1254755000')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await bobaDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 0.62 as per the exchange value
      expect(requiredTokens).to.be.eq('627377')
    })
  })
})
