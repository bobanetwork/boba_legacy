import './aa.init'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  SimpleWallet,
  SimpleWallet__factory,
  EntryPoint,
  BobaDepositPaymaster,
  BobaDepositPaymaster__factory,
  TestCounter,
  TestCounter__factory,
  TestToken,
  TestToken__factory,
  MockFeedRegistry__factory,
  MockFeedRegistry
} from '../typechain'
import {
  AddressZero, createAddress,
  createWalletOwner,
  deployEntryPoint, FIVE_ETH, ONE_ETH, simulationResultCatch, userOpsWithoutAgg
} from './testutils'
import { fillAndSign } from './UserOp'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'

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
      await expect(new BobaDepositPaymaster__factory(ethersSigner).deploy(entryPoint.address, ethers.constants.AddressZero)).to.be.revertedWith('Incorrect eth oracle')
    })
  })

  describe('addToken', () => {
    it('should not allow incorrect token oracle', async () => {
      await expect(paymaster.addToken(token.address, ethers.constants.AddressZero, token.address, 18)).to.be.revertedWith('Incorrect token oracle')
    })
  })

  describe('deposit', () => {
    let wallet: SimpleWallet

    before(async () => {
      wallet = await new SimpleWallet__factory(ethersSigner).deploy(entryPoint.address, await ethersSigner.getAddress())
    })
    it('should deposit and read balance', async () => {
      await paymaster.addDepositFor(token.address, wallet.address, 100)
      expect(await paymaster.depositInfo(token.address, wallet.address)).to.eql({ amount: 100 })
    })
    it('should fail to deposit native token', async () => {
      const nativeTokenAddress = await paymaster.L2_ETH_ADDRESS()
      await expect(paymaster.addDepositFor(nativeTokenAddress, wallet.address, 100)).to.be.reverted
    })
    it('should fail to withdraw without unlock', async () => {
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(token.address, AddressZero, 1).then(tx => tx.data!)

      await expect(
        wallet.exec(paymaster.address, 0, paymasterWithdraw)
      ).to.revertedWith('DepositPaymaster: must unlockTokenDeposit')
    })
    it('should fail to withdraw within the same block ', async () => {
      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(token.address, AddressZero, 1).then(tx => tx.data!)

      await expect(
        wallet.execBatch([paymaster.address, paymaster.address], [paymasterUnlock, paymasterWithdraw])
      ).to.be.revertedWith('DepositPaymaster: must unlockTokenDeposit')
    })
    it('should succeed to withdraw after unlock', async () => {
      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      const target = createAddress()
      const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(token.address, target, 1).then(tx => tx.data!)
      await wallet.exec(paymaster.address, 0, paymasterUnlock)
      await wallet.exec(paymaster.address, 0, paymasterWithdraw)
      expect(await token.balanceOf(target)).to.eq(1)
    })
  })

  describe('#validatePaymasterUserOp', () => {
    let wallet: SimpleWallet
    const gasPrice = 1e9
    let walletOwner: string

    before(async () => {
      walletOwner = await ethersSigner.getAddress()
      wallet = await new SimpleWallet__factory(ethersSigner).deploy(entryPoint.address, walletOwner)
    })

    it('should fail if no token', async () => {
      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: paymaster.address
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp)).to.be.revertedWith('paymasterAndData must specify token')
    })

    it('should fail with wrong token', async () => {
      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad('0x1234', 20)])
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('DepositPaymaster: unsupported token')
    })

    it('should reject if no deposit', async () => {
      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('DepositPaymaster: deposit too low')
    })

    it('should reject if deposit is not locked', async () => {
      await paymaster.addDepositFor(token.address, wallet.address, ONE_ETH)

      const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
      await wallet.exec(paymaster.address, 0, paymasterUnlock)

      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
      }, ethersSigner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('not locked')
    })

    it('succeed with valid deposit', async () => {
      // needed only if previous test did unlock.
      const paymasterLockTokenDeposit = await paymaster.populateTransaction.lockTokenDeposit().then(tx => tx.data!)
      await wallet.exec(paymaster.address, 0, paymasterLockTokenDeposit)

      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
      }, ethersSigner, entryPoint)
      await entryPoint.callStatic.simulateValidation(userOp).catch(simulationResultCatch)
    })
  })

  describe('#handleOps', () => {
    let wallet: SimpleWallet
    const walletOwner = createWalletOwner()
    let counter: TestCounter
    let callData: string
    before(async () => {
      wallet = await new SimpleWallet__factory(ethersSigner).deploy(entryPoint.address, walletOwner.address)
      counter = await new TestCounter__factory(ethersSigner).deploy()
      const counterJustEmit = await counter.populateTransaction.justemit().then(tx => tx.data!)
      callData = await wallet.populateTransaction.execFromEntryPoint(counter.address, 0, counterJustEmit).then(tx => tx.data!)

      await paymaster.addDepositFor(token.address, wallet.address, ONE_ETH)
    })
    it('should pay with deposit (and revert user\'s call) if user can\'t pay with tokens', async () => {
      const beneficiary = createAddress()
      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
        callData
      }, walletOwner, entryPoint)

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
      await token.mint(wallet.address, initialTokens)

      // need to "approve" the paymaster to use the tokens. we issue a UserOp for that (which uses the deposit to execute)
      const tokenApprovePaymaster = await token.populateTransaction.approve(paymaster.address, ethers.constants.MaxUint256).then(tx => tx.data!)
      const execApprove = await wallet.populateTransaction.execFromEntryPoint(token.address, 0, tokenApprovePaymaster).then(tx => tx.data!)
      const userOp1 = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
        callData: execApprove
      }, walletOwner, entryPoint)
      await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp1]), beneficiary1)

      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
        callData
      }, walletOwner, entryPoint)
      await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp]), beneficiary)

      const [log] = await entryPoint.queryFilter(entryPoint.filters.UserOperationEvent(), await ethers.provider.getBlockNumber())
      expect(log.args.success).to.eq(true)
      const charge = log.args.actualGasCost
      expect(await ethers.provider.getBalance(beneficiary)).to.eq(charge)

      const targetLogs = await counter.queryFilter(counter.filters.CalledFrom())
      expect(targetLogs.length).to.eq(1)
    })
  })
})
