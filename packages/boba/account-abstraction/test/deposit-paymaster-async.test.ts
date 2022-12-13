import './aa.init'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  SimpleWallet,
  SimpleWallet__factory,
  EntryPoint,
  AsyncDepositPaymaster,
  AsyncDepositPaymaster__factory,
  TestCounter,
  TestCounter__factory,
  TestToken,
  TestToken__factory,
  TestTokenValueAsyncDepositPaymaster__factory,
  TestTokenValueAsyncDepositPaymaster
} from '../typechain'
import {
  AddressZero, createAddress,
  createWalletOwner,
  deployEntryPoint, FIVE_ETH, ONE_ETH, simulationResultCatch, userOpsWithoutAgg
} from './testutils'
import { fillAndSign } from './UserOp'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'

describe('AsyncDepositPaymaster', () => {
  let entryPoint: EntryPoint
  const ethersSigner = ethers.provider.getSigner()
  let token: TestToken
  let paymaster: AsyncDepositPaymaster
  const priceRatio = 50
  const priceRatioDecimals = 2
  const minRatio = 1
  const maxRatio = 500
  before(async function () {
    entryPoint = await deployEntryPoint()

    paymaster = await new AsyncDepositPaymaster__factory(ethersSigner).deploy(entryPoint.address)
    await paymaster.addStake(1, { value: parseEther('2') })
    await entryPoint.depositTo(paymaster.address, { value: parseEther('1') })

    token = await new TestToken__factory(ethersSigner).deploy()
    const tokenDecimals = await token.decimals()
    await paymaster.addToken(token.address, tokenDecimals, priceRatio, priceRatioDecimals, minRatio, maxRatio)

    await token.mint(await ethersSigner.getAddress(), FIVE_ETH)
    await token.approve(paymaster.address, ethers.constants.MaxUint256)
  })

  describe('addToken', () => {
    it('should not allow adding invalid token', async () => {
      await expect(paymaster.addToken(ethers.constants.AddressZero, await token.decimals(), priceRatio, priceRatioDecimals, minRatio, maxRatio)).to.be.revertedWith('DepositPaymaster: Invalid token')
    })
    it('should not allow zero priceRatio', async () => {
      const tokenSample = await new TestToken__factory(ethersSigner).deploy()
      await expect(paymaster.addToken(tokenSample.address, await token.decimals(), 0, priceRatioDecimals, minRatio, maxRatio)).to.be.revertedWith('DepositPaymaster: price ratio cannot be zero')
    })
    it('should not allow incorrect priceRatio ranges', async () => {
      const tokenSample = await new TestToken__factory(ethersSigner).deploy()
      await expect(paymaster.addToken(tokenSample.address, await token.decimals(), priceRatio, priceRatioDecimals, minRatio, 0)).to.be.revertedWith('DepositPaymaster: Invalid price ratio')
      await expect(paymaster.addToken(tokenSample.address, await token.decimals(), priceRatio, priceRatioDecimals, 0, maxRatio)).to.be.revertedWith('DepositPaymaster: min ratio cannot be zero')
      await expect(paymaster.addToken(tokenSample.address, await token.decimals(), 100, priceRatioDecimals, 400, 500)).to.be.revertedWith('DepositPaymaster: Invalid price ratio')
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
    it('should fail to deposit unsupported token', async () => {
      const tokenSample = await new TestToken__factory(ethersSigner).deploy()
      await tokenSample.mint(await ethersSigner.getAddress(), FIVE_ETH)
      await tokenSample.approve(paymaster.address, ethers.constants.MaxUint256)
      await expect(paymaster.addDepositFor(tokenSample.address, wallet.address, 100)).to.be.revertedWith('DepositPaymaster: unsupported token');
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
  describe('token params', () => {
    let wallet: SimpleWallet

    before(async () => {
      wallet = await new SimpleWallet__factory(ethersSigner).deploy(entryPoint.address, await ethersSigner.getAddress())
    })
    it('should not allow non owner to update priceRatio', async () => {
      const updatePriceRatio = await paymaster.populateTransaction.updatePriceRatio(token.address, 60).then(tx => tx.data!)

      await expect(
        wallet.exec(paymaster.address, 0, updatePriceRatio)
      ).to.revertedWith('Ownable: caller is not the owner')
    })
    it('should not allow non owner to update token params', async () => {
      const updateParams = await paymaster.populateTransaction.updateTokenParams(token.address, priceRatioDecimals, 10, 1000).then(tx => tx.data!)

      await expect(
        wallet.exec(paymaster.address, 0, updateParams)
      ).to.revertedWith('Ownable: caller is not the owner')
    })
    it('should allow only the owner to update token params and priceRatio', async () => {
      await paymaster.updateTokenParams(token.address, priceRatioDecimals, 10, 1000)
      await paymaster.updatePriceRatio(token.address, 60)

      const priceRatio = (await paymaster.priceRatioInfo(token.address)).priceRatio
      const minRatio = (await paymaster.priceRatioInfo(token.address)).minRatio
      const maxRatio = (await paymaster.priceRatioInfo(token.address)).maxRatio

      expect(priceRatio).to.be.eq(60)
      expect(minRatio).to.be.eq(10)
      expect(maxRatio).to.be.eq(1000)
    })
  })
  describe('getTokenValueOfEth', () => {
    let asyncDepositPaymaster: TestTokenValueAsyncDepositPaymaster
    let tokenAlt: TestToken
    before(async () => {
      asyncDepositPaymaster = await new TestTokenValueAsyncDepositPaymaster__factory(ethersSigner).deploy(entryPoint.address)
      // add boba token
      await asyncDepositPaymaster.addToken(token.address, await token.decimals(), priceRatio, priceRatioDecimals, minRatio, maxRatio)
    })
    it('should return correct conversion', async () => {
      const ethBoughtAmount = ethers.utils.parseEther('1')
      const requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(token.address, ethBoughtAmount)
      // oracle returns 1:1 conversion
      expect(requiredTokens).to.be.eq(ethBoughtAmount.mul(10 ** priceRatioDecimals / priceRatio))
    })
    it('should return correct conversion on different priceRatio values', async () => {
      tokenAlt = await new TestToken__factory(ethersSigner).deploy()
      const tokenDecimals = await tokenAlt.decimals()
      // set price ratio, example boba
      const priceRatio = 17224478
      const priceRatioDecimals = 11
      const minRatio = 11000000
      const maxRatio = 25000000
      await asyncDepositPaymaster.addToken(tokenAlt.address, tokenDecimals, priceRatio, priceRatioDecimals, minRatio, maxRatio)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 5805.69 as per the exchange value
      expect(requiredTokens).to.be.eq('5805691179726897964629')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 2.90 as per the exchange value
      expect(requiredTokens).to.be.eq('2902845589863448982')
    })
    it('should return correct conversion on different priceRatio decimals', async () => {
      tokenAlt = await new TestToken__factory(ethersSigner).deploy()
      const tokenDecimals = await tokenAlt.decimals()
      // set new price ratio decimals, example boba
      const priceRatio = 17224478000
      const priceRatioDecimals = 14
      const minRatio = 11000000000
      const maxRatio = 25000000000
      await asyncDepositPaymaster.addToken(tokenAlt.address, tokenDecimals, priceRatio, priceRatioDecimals, minRatio, maxRatio)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 5805.69 as per the exchange value
      expect(requiredTokens).to.be.eq('5805691179726897964629')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 2.90 as per the exchange value
      expect(requiredTokens).to.be.eq('2902845589863448982')
    })
    it('should return correct conversion on different token decimals', async () => {
      tokenAlt = await new TestToken__factory(ethersSigner).deploy()
      // set price ratio, example usdc
      // adjust decimals
      await tokenAlt.setDecimals(6)
      const tokenDecimals = await tokenAlt.decimals()
      const priceRatio = 79696833
      const priceRatioDecimals = 11
      const minRatio = 11000000
      const maxRatio = 250000000
      await asyncDepositPaymaster.addToken(tokenAlt.address, tokenDecimals, priceRatio, priceRatioDecimals, minRatio, maxRatio)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 1254.75 as per the exchange value
      expect(requiredTokens).to.be.eq('1254755003')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 0.62 as per the exchange value
      expect(requiredTokens).to.be.eq('627377')
    })
    it('should return correct conversion on different priceRatio and token decimals', async () => {
      tokenAlt = await new TestToken__factory(ethersSigner).deploy()
      // set price ratio, example usdc
      // adjust decimals
      await tokenAlt.setDecimals(6)
      const tokenDecimals = await tokenAlt.decimals()
      const priceRatio = 79696833000
      const priceRatioDecimals = 14
      const minRatio = 11000000000
      const maxRatio = 250000000000
      await asyncDepositPaymaster.addToken(tokenAlt.address, tokenDecimals, priceRatio, priceRatioDecimals, minRatio, maxRatio)

      let ethBoughtAmount = ethers.utils.parseEther('1')
      let requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 1254.75 as per the exchange value
      expect(requiredTokens).to.be.eq('1254755003')

      ethBoughtAmount = ethers.utils.parseEther('0.0005')
      requiredTokens = await asyncDepositPaymaster.getTokenValueOfEthTest(tokenAlt.address, ethBoughtAmount)
      // required Tokens should be approx. 0.62 as per the exchange value
      expect(requiredTokens).to.be.eq('627377')
    })
  })
})
