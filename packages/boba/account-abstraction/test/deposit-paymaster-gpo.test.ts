import './aa.init'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  SimpleAccount,
  EntryPoint,
  GPODepositPaymaster,
  GPODepositPaymaster__factory,
  TestCounter,
  TestCounter__factory,
  TestToken,
  TestToken__factory,
  MockGasPriceOracle,
  MockGasPriceOracle__factory,
  TestTokenValueGPODepositPaymaster__factory,
  TestTokenValueGPODepositPaymaster
} from '../typechain'
import {
  AddressZero, createAddress,
  createAccountOwner,
  deployEntryPoint, FIVE_ETH, ONE_ETH, simulationResultCatch, userOpsWithoutAgg, createAccount
} from './testutils'
import { fillAndSign } from './UserOp'
import { parseEther } from 'ethers/lib/utils'

describe('GPODepositPaymaster', () => {
  let entryPoint: EntryPoint
  const ethersSigner = ethers.provider.getSigner()
  let token: TestToken
  let gasPriceOracle: MockGasPriceOracle
  let paymaster: GPODepositPaymaster
  before(async function () {
    entryPoint = await deployEntryPoint()

    token = await new TestToken__factory(ethersSigner).deploy()
    const tokenDecimals = await token.decimals()

    // deploy mock gas price oracle
    gasPriceOracle = await new MockGasPriceOracle__factory(ethersSigner).deploy()

    paymaster = await new GPODepositPaymaster__factory(ethersSigner).deploy(entryPoint.address, token.address, tokenDecimals, gasPriceOracle.address)
    await paymaster.addStake(1, { value: parseEther('2') })
    await entryPoint.depositTo(paymaster.address, { value: parseEther('1') })

    await token.mint(await ethersSigner.getAddress(), FIVE_ETH)
    await token.approve(paymaster.address, ethers.constants.MaxUint256)
  })

  describe('deposit', () => {
    let account: SimpleAccount

    before(async () => {
      ({ proxy: account } = await createAccount(ethersSigner, await ethersSigner.getAddress(), entryPoint.address))
    })
    it('should deposit and read balance', async () => {
      await paymaster.addDepositFor(account.address, 100)
      expect(await paymaster.depositInfo(account.address)).to.eql({ amount: 100 })
    })
    it('should fail to withdraw without unlock', async () => {
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(AddressZero, 1).then(tx => tx.data!)

      await expect(
        account.execute(paymaster.address, 0, paymasterWithdraw)
      ).to.revertedWith('DepositPaymaster: must unlockTokenDeposit')
    })
    it('should fail to withdraw within the same block ', async () => {
      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(AddressZero, 1).then(tx => tx.data!)

      await expect(
        account.executeBatch([paymaster.address, paymaster.address], [paymasterUnlock, paymasterWithdraw])
      ).to.be.revertedWith('DepositPaymaster: must unlockTokenDeposit')
    })
    it('should succeed to withdraw after unlock', async () => {
      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      const target = createAddress()
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(target, 1).then(tx => tx.data!)
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

    it('should reject if no deposit', async () => {
      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: paymaster.address,
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('DepositPaymaster: deposit too low')
    })

    it('should reject if deposit is not locked', async () => {
      await paymaster.addDepositFor(account.address, ONE_ETH)

      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      await account.execute(paymaster.address, 0, paymasterUnlock)

      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: paymaster.address,
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('not locked')
    })

    it('succeed with valid deposit', async () => {
      // needed only if previous test did unlock.
      const paymasterLockTokenDeposit = await paymaster.populateTransaction.lockTokenDeposit().then(tx => tx.data!)
      await account.execute(paymaster.address, 0, paymasterLockTokenDeposit)

      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: paymaster.address
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

      await paymaster.addDepositFor(account.address, ONE_ETH)
    })
    it('should pay with deposit (and revert user\'s call) if user can\'t pay with tokens', async () => {
      const beneficiary = createAddress()
      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: paymaster.address,
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
        paymasterAndData: paymaster.address,
        callData: execApprove
      }, accountOwner, entryPoint)
      await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp1]), beneficiary1)

      const userOp = await fillAndSign({
        sender: account.address,
        paymasterAndData: paymaster.address,
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
    let gpoDepositPaymaster: TestTokenValueGPODepositPaymaster
    let tokenAlt: TestToken
    before(async () => {
      gpoDepositPaymaster = await new TestTokenValueGPODepositPaymaster__factory(ethersSigner).deploy(entryPoint.address, token.address, await token.decimals(), gasPriceOracle.address)
    })
    it('should return correct conversion', async () => {
      await gasPriceOracle.updateFixedReturnValue(78125)
      await gasPriceOracle.updateDecimals(1)
      const ethBoughtAmount = ethers.utils.parseEther('1')
      const requiredTokens = await gpoDepositPaymaster.getTokenValueOfEthTest(ethBoughtAmount)
      expect(requiredTokens).to.be.eq('7812500000000000000000')
    })
    it('should return correct conversion on different priceRatio decimals', async () => {
      await gasPriceOracle.updateFixedReturnValue(7812500000)
      await gasPriceOracle.updateDecimals(6)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await gpoDepositPaymaster.getTokenValueOfEthTest(ethBoughtAmount)
      expect(requiredTokens).to.be.eq('7812500000000000000000')
    })
    it('should return correct conversion on different token decimals', async () => {
      tokenAlt = await new TestToken__factory(ethersSigner).deploy()
      // set price ratio, example usdc
      // adjust decimals
      await tokenAlt.setDecimals(6)

      gpoDepositPaymaster = await new TestTokenValueGPODepositPaymaster__factory(ethersSigner).deploy(entryPoint.address, tokenAlt.address, await tokenAlt.decimals(), gasPriceOracle.address)

      await gasPriceOracle.updateFixedReturnValue(78125)
      await gasPriceOracle.updateDecimals(1)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await gpoDepositPaymaster.getTokenValueOfEthTest(ethBoughtAmount)
      expect(requiredTokens).to.be.eq('7812500000')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await gpoDepositPaymaster.getTokenValueOfEthTest(ethBoughtAmount)
      expect(requiredTokens).to.be.eq('3906250')
    })
  })
})
