import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { BigNumber, Contract, utils, ContractFactory } from 'ethers'
import ethSigUtil from 'eth-sig-util'
import { predeploys, getContractFactory } from '@bobanetwork/core_contracts'

/* Imports: Internal */
import { OptimismEnv } from './shared/env'
import { gasPriceOracleWallet, l1Wallet } from './shared/utils'

const setPrices = async (env: OptimismEnv, value: number | BigNumber) => {
  const gasPrice = await env.messenger.contracts.l2.OVM_GasPriceOracle.connect(
    gasPriceOracleWallet
  ).setGasPrice(value)
  await gasPrice.wait()
  const baseFee = await env.messenger.contracts.l2.OVM_GasPriceOracle.connect(
    gasPriceOracleWallet
  ).setL1BaseFee(value)
  await baseFee.wait()
}

describe('Boba Fee Payment Integration Tests', async () => {
  let env: OptimismEnv
  let secondaryFeeToken: Contract
  let Boba_GasPriceOracle: Contract
  let Proxy__Boba_GasPriceOracle: Contract

  let Factory__Boba_GasPriceOracleProxyCall: ContractFactory
  let Boba_GasPriceOracleProxyCall: Contract

  const other = '0x1234123412341234123412341234123412341234'

  before(async () => {
    env = await OptimismEnv.new()

    secondaryFeeToken = getContractFactory('L2_L1NativeToken')
      .attach(predeploys.L2_L1NativeToken_ALT_L1)
      .connect(env.l2Wallet)
    Boba_GasPriceOracle = getContractFactory('Boba_GasPriceOracleAltL1')
      .attach(predeploys.Proxy__Boba_GasPriceOracle)
      .connect(env.l2Wallet)

    Proxy__Boba_GasPriceOracle = getContractFactory(
      'Lib_ResolvedDelegateBobaProxy'
    )
      .attach(predeploys.Proxy__Boba_GasPriceOracle)
      .connect(env.l2Wallet)

    Factory__Boba_GasPriceOracleProxyCall = await ethers.getContractFactory(
      'Boba_GasPriceOracleProxyCall',
      env.l2Wallet
    )

    Boba_GasPriceOracleProxyCall =
      await Factory__Boba_GasPriceOracleProxyCall.deploy(
        Boba_GasPriceOracle.address
      )
    await Boba_GasPriceOracleProxyCall.deployTransaction.wait()
  })

  it('should have correct proxy target and proxy owner', async () => {
    expect(
      await Proxy__Boba_GasPriceOracle.addressManager('proxyOwner')
    ).to.be.eq(env.l1Wallet.address)
    expect(
      await Proxy__Boba_GasPriceOracle.addressManager('proxyTarget')
    ).to.be.eq(predeploys.Boba_GasPriceOracle)
  })

  it('should register to use secondary fee token as the fee token', async () => {
    // Register l1wallet for using secondary fee token as the fee token
    const registerTx =
      await Boba_GasPriceOracle.useSecondaryFeeTokenAsFeeToken()
    await registerTx.wait()

    expect(
      await Boba_GasPriceOracle.secondaryFeeTokenUsers(env.l2Wallet.address)
    ).to.be.deep.eq(true)
  })

  it('should not register the fee tokens for non EOA accounts', async () => {
    await expect(Boba_GasPriceOracleProxyCall.useBobaAsFeeToken()).to.be
      .reverted
    await expect(Boba_GasPriceOracleProxyCall.useSecondaryFeeTokenAsFeeToken())
      .to.be.reverted
  })

  it('should set price ratio decimal to 1', async () => {
    await Boba_GasPriceOracle.connect(gasPriceOracleWallet).updateDecimals(1)
    expect(await Boba_GasPriceOracle.decimals()).to.be.eq(BigNumber.from('1'))
  })

  it('Paying a nonzero but acceptable secondary fee token gasPrice fee for transferring Boba', async () => {
    await setPrices(env, 1000)

    const amount = utils.parseEther('0.0000001')
    const BobaBalanceBefore = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceBefore =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    expect(BobaBalanceBefore.gt(amount))

    const unsigned = await env.l2Wallet.populateTransaction({
      to: other,
      value: amount,
      gasLimit: 500000,
    })

    const tx = await env.l2Wallet.sendTransaction(unsigned)
    const receipt = await tx.wait()
    expect(receipt.status).to.eq(1)

    const BobaBalanceAfter = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceAfter =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
    const txSecondaryFeeTokenFee = receipt.gasUsed
      .mul(tx.gasPrice)
      .mul(priceRatio)
      .div(priceRatioDivisor)

    // Make sure that user only pay transferred Boba
    expect(BobaBalanceBefore.sub(BobaBalanceAfter)).to.deep.equal(amount)

    // Make sure that the Boba Fee Vault doesn't change
    expect(BobaFeeVaultBalanceAfter).to.deep.equal(BobaFeeVaultBalanceBefore)

    // Make sure that we deduct boba from user's account
    expect(
      SecondaryFeeTokenBalanceBefore.sub(SecondaryFeeTokenBalanceAfter)
    ).to.deep.equal(txSecondaryFeeTokenFee)

    // Make sure that the boba fee vault receives the tx fee
    expect(
      SecondaryFeeTokenFeeVaultBalanceAfter.sub(
        SecondaryFeeTokenFeeVaultBalanceBefore
      )
    ).to.deep.equal(txSecondaryFeeTokenFee)

    await setPrices(env, 1)
  })

  it('Paying a nonzero but acceptable secondary fee token gasPrice fee for transferring secondary fee token', async () => {
    await setPrices(env, 1000)

    const amount = utils.parseEther('0.0000001')
    const BobaBalanceBefore = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceBefore =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    expect(SecondaryFeeTokenFeeVaultBalanceBefore.gt(amount))

    const tx = await secondaryFeeToken.transfer(other, amount)
    const receipt = await tx.wait()
    expect(receipt.status).to.eq(1)

    const BobaBalanceAfter = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceAfter =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
    const txSecondaryFeeTokenFee = receipt.gasUsed
      .mul(tx.gasPrice)
      .mul(priceRatio)
      .div(priceRatioDivisor)

    // Make sure that Boba balance doesn't change
    expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)

    // Make sure that the Boba Fee Vault doesn't change
    expect(BobaFeeVaultBalanceAfter).to.deep.equal(BobaFeeVaultBalanceBefore)

    // Make sure that we deduct secondary fee token from user's account
    expect(
      SecondaryFeeTokenBalanceBefore.sub(SecondaryFeeTokenBalanceAfter)
    ).to.deep.equal(txSecondaryFeeTokenFee.add(amount))

    // Make sure that the secondary fee token fee vault receives the tx fee
    expect(
      SecondaryFeeTokenFeeVaultBalanceAfter.sub(
        SecondaryFeeTokenFeeVaultBalanceBefore
      )
    ).to.deep.equal(txSecondaryFeeTokenFee)

    await setPrices(env, 1)
  })

  it("Should revert if users don't have enough secondary fee token tokens", async () => {
    await setPrices(env, 1000)

    const BobaBalanceBefore = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceBefore =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    await expect(
      secondaryFeeToken.transfer(other, SecondaryFeeTokenBalanceBefore)
    ).to.be.revertedWith(
      'execution reverted: ERC20: transfer amount exceeds balance'
    )
    const BobaBalanceAfter = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceAfter =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

    // Make sure that Boba balance doesn't change
    expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)

    // Make sure that the Boba Fee Vault doesn't change
    expect(BobaFeeVaultBalanceAfter).to.deep.equal(BobaFeeVaultBalanceBefore)

    // Make sure that we don't deduct secondary fee token from user's account
    expect(SecondaryFeeTokenBalanceBefore).to.deep.equal(
      SecondaryFeeTokenBalanceAfter
    )

    // Make sure that the secondary fee token vault doesn't change
    expect(SecondaryFeeTokenFeeVaultBalanceAfter).to.deep.equal(
      SecondaryFeeTokenFeeVaultBalanceBefore
    )

    await setPrices(env, 1)
  })

  it('should compute correct secondary fee token fee for transferring Boba', async () => {
    await setPrices(env, 1000)

    const BobaBalanceBefore = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceBefore =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    const unsigned = await env.l2Wallet.populateTransaction({
      to: env.l2Wallet.address,
      value: 0,
    })

    const tx = await env.l2Wallet.sendTransaction(unsigned)
    const receipt = await tx.wait()
    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
    const txSecondaryFeeTokenFee = receipt.gasUsed
      .mul(tx.gasPrice)
      .mul(priceRatio)
      .div(priceRatioDivisor)
    const BobaBalanceAfter = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceAfter =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
      SecondaryFeeTokenBalanceAfter
    )
    const SecondaryFeeTokenFeeReceived =
      SecondaryFeeTokenFeeVaultBalanceAfter.sub(
        SecondaryFeeTokenFeeVaultBalanceBefore
      )
    expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
    // There is no inflation
    expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
      SecondaryFeeTokenBalanceDiff
    )

    expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
    expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

    await setPrices(env, 1)
  })

  it('should compute correct secondary fee token fee for transferring Boba', async () => {
    await setPrices(env, 1000)

    const BobaBalanceBefore = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceBefore =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    const unsigned = await env.l2Wallet.populateTransaction({
      to: env.l2Wallet.address,
      value: 0,
    })

    const tx = await env.l2Wallet.sendTransaction(unsigned)
    const receipt = await tx.wait()
    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
    const txSecondaryFeeTokenFee = receipt.gasUsed
      .mul(tx.gasPrice)
      .mul(priceRatio)
      .div(priceRatioDivisor)
    const BobaBalanceAfter = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceAfter =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
      SecondaryFeeTokenBalanceAfter
    )
    const SecondaryFeeTokenFeeReceived =
      SecondaryFeeTokenFeeVaultBalanceAfter.sub(
        SecondaryFeeTokenFeeVaultBalanceBefore
      )
    expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
    // There is no inflation
    expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
      SecondaryFeeTokenBalanceDiff
    )

    expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
    expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

    await setPrices(env, 1)
  })

  it('should compute correct tx fee for transferring secondary fee token', async () => {
    await setPrices(env, 1000)

    const BobaBalanceBefore = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceBefore =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

    const tx = await secondaryFeeToken.transfer(env.l2Wallet.address, 0)
    const receipt = await tx.wait()
    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
    const txSecondaryFeeTokenFee = receipt.gasUsed
      .mul(tx.gasPrice)
      .mul(priceRatio)
      .div(priceRatioDivisor)
    const BobaBalanceAfter = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceAfter =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
      SecondaryFeeTokenBalanceAfter
    )
    const SecondaryFeeTokenFeeReceived =
      SecondaryFeeTokenFeeVaultBalanceAfter.sub(
        SecondaryFeeTokenFeeVaultBalanceBefore
      )
    expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
    // There is no inflation
    expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
      SecondaryFeeTokenBalanceDiff
    )

    expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
    expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

    await setPrices(env, 1)
  })

  it('should compute correct fee with different gas limit for transferring Boba', async () => {
    await setPrices(env, 1000)

    const estimatedGas = await env.l2Wallet.estimateGas({
      to: env.l2Wallet.address,
      value: ethers.utils.parseEther('1'),
    })
    let gasLimit = estimatedGas.toNumber()

    while (gasLimit < estimatedGas.toNumber() + 1000) {
      const BobaBalanceBefore = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceBefore =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const tx = await env.l2Wallet.sendTransaction({
        to: env.l2Wallet.address,
        value: ethers.utils.parseEther('1'),
        gasLimit,
      })
      const receipt = await tx.wait()
      const priceRatio = await Boba_GasPriceOracle.priceRatio()
      const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
      const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
      const txSecondaryFeeTokenFee = receipt.gasUsed
        .mul(tx.gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)
      const BobaBalanceAfter = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceAfter =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
        SecondaryFeeTokenBalanceAfter
      )
      const SecondaryFeeTokenFeeReceived =
        SecondaryFeeTokenFeeVaultBalanceAfter.sub(
          SecondaryFeeTokenFeeVaultBalanceBefore
        )

      expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
      // There is no inflation
      expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
        SecondaryFeeTokenBalanceDiff
      )

      expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
      expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

      gasLimit += 100
    }

    await setPrices(env, 1)
  })

  it('should compute correct fee with different gas limit for transferring secondary fee token', async () => {
    await setPrices(env, 1000)

    const estimatedGas = await secondaryFeeToken.estimateGas.transfer(
      env.l2Wallet.address,
      ethers.utils.parseEther('1')
    )
    let gasLimit = estimatedGas.toNumber()

    while (gasLimit < estimatedGas.toNumber() + 1000) {
      const BobaBalanceBefore = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceBefore =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const tx = await secondaryFeeToken.transfer(
        env.l2Wallet.address,
        ethers.utils.parseEther('1'),
        { gasLimit }
      )
      const receipt = await tx.wait()
      const priceRatio = await Boba_GasPriceOracle.priceRatio()
      const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
      const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
      const txSecondaryFeeTokenFee = receipt.gasUsed
        .mul(tx.gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)
      const BobaBalanceAfter = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceAfter =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
        SecondaryFeeTokenBalanceAfter
      )
      const SecondaryFeeTokenFeeReceived =
        SecondaryFeeTokenFeeVaultBalanceAfter.sub(
          SecondaryFeeTokenFeeVaultBalanceBefore
        )

      expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
      // There is no inflation
      expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
        SecondaryFeeTokenBalanceDiff
      )

      expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
      expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

      gasLimit += 100
    }

    await setPrices(env, 1)
  })

  it('should reject a transaction with a too low gas limit', async () => {
    const tx = {
      to: env.l2Wallet.address,
      value: ethers.utils.parseEther('1'),
      gasLimit: 1100000,
    }

    const gasLimit = await env.l2Wallet.estimateGas(tx)
    tx.gasLimit = gasLimit.toNumber() - 10

    await expect(env.l2Wallet.sendTransaction(tx)).to.be.rejectedWith(
      'invalid transaction: intrinsic gas too low'
    )
  })

  it('should not be able to withdraw fees before the minimum is met', async function () {
    const SecondaryFeeTokenBalance = await secondaryFeeToken.balanceOf(
      Boba_GasPriceOracle.address
    )
    const MIN_WITHDRAWAL_AMOUNT =
      await Boba_GasPriceOracle.MIN_WITHDRAWAL_AMOUNT()
    if (SecondaryFeeTokenBalance.gt(MIN_WITHDRAWAL_AMOUNT)) {
      this.skip()
    }
    await expect(Boba_GasPriceOracle.withdrawSecondaryFeeToken()).to.be.rejected
  })

  it('should be able to withdraw fees back to L1 once the minimum is met', async function () {
    const feeWallet = await Boba_GasPriceOracle.feeWallet()
    const balanceBefore = await l1Wallet.provider.getBalance(feeWallet)
    const withdrawalAmount = await Boba_GasPriceOracle.MIN_WITHDRAWAL_AMOUNT()

    const l2WalletBalance = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    if (l2WalletBalance.lt(withdrawalAmount)) {
      console.log(
        `NOTICE: must have at least ${ethers.utils.formatEther(
          withdrawalAmount
        )} BOBA on L2 to execute this test, skipping`
      )
      this.skip()
    }

    // Transfer the minimum required to withdraw.
    const tx = await secondaryFeeToken.transfer(
      Boba_GasPriceOracle.address,
      withdrawalAmount
    )
    await tx.wait()

    const vaultBalance = await secondaryFeeToken.balanceOf(
      Boba_GasPriceOracle.address
    )

    // Submit the withdrawal.
    const withdrawTx = await Boba_GasPriceOracle.withdrawSecondaryFeeToken({
      gasPrice: 0,
    })

    // Wait for the withdrawal to be relayed to L1.
    await withdrawTx.wait()
    await env.relayXDomainMessages(withdrawTx)
    await env.waitForXDomainTransaction(withdrawTx)

    // Balance difference should be equal to old L2 balance.
    const balanceAfter = await l1Wallet.provider.getBalance(feeWallet)
    expect(balanceAfter.sub(balanceBefore)).to.deep.equal(
      BigNumber.from(vaultBalance)
    )
  })

  // Boba Ethereum special fields on the receipt
  it('includes secondary fee token fee in the receipt', async () => {
    const l1Fee = await env.messenger.contracts.l2.OVM_GasPriceOracle.getL1Fee(
      '0x'
    )
    const l1GasPrice =
      await env.messenger.contracts.l2.OVM_GasPriceOracle.l1BaseFee()
    const l1GasUsed =
      await env.messenger.contracts.l2.OVM_GasPriceOracle.getL1GasUsed('0x')
    const scalar = await env.messenger.contracts.l2.OVM_GasPriceOracle.scalar()
    const decimals =
      await env.messenger.contracts.l2.OVM_GasPriceOracle.decimals()

    const scaled = scalar.toNumber() / 10 ** decimals.toNumber()

    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)

    const tx = await env.l2Wallet.sendTransaction({
      to: env.l2Wallet.address,
      value: ethers.utils.parseEther('1'),
    })
    const receipt = await tx.wait()
    const txSecondaryFeeTokenFee = receipt.gasUsed
      .mul(tx.gasPrice)
      .mul(priceRatio)
      .div(priceRatioDivisor)
    const json = await env.l2Provider.send('eth_getTransactionReceipt', [
      tx.hash,
    ])
    expect(l1GasUsed).to.deep.equal(BigNumber.from(json.l1GasUsed))
    expect(l1GasPrice).to.deep.equal(BigNumber.from(json.l1GasPrice))
    expect(scaled.toString()).to.deep.equal(json.l1FeeScalar)
    expect(l1Fee).to.deep.equal(BigNumber.from(json.l1Fee))
    expect(json.l2BobaFee).to.deep.equal(txSecondaryFeeTokenFee)
  })

  // Boba Ethereum special fields on the receipt
  it('includes secondary fee token fee with different gas price', async () => {
    const l1Fee = await env.messenger.contracts.l2.OVM_GasPriceOracle.getL1Fee(
      '0x'
    )
    const l1GasPrice =
      await env.messenger.contracts.l2.OVM_GasPriceOracle.l1BaseFee()
    const l1GasUsed =
      await env.messenger.contracts.l2.OVM_GasPriceOracle.getL1GasUsed('0x')
    const scalar = await env.messenger.contracts.l2.OVM_GasPriceOracle.scalar()
    const decimals =
      await env.messenger.contracts.l2.OVM_GasPriceOracle.decimals()

    const scaled = scalar.toNumber() / 10 ** decimals.toNumber()

    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)

    let gasPrice = 1

    while (gasPrice < 10) {
      const tx = await env.l2Wallet.sendTransaction({
        to: env.l2Wallet.address,
        value: ethers.utils.parseEther('1'),
        gasPrice,
      })
      const receipt = await tx.wait()
      const txSecondaryFeeTokenFee = receipt.gasUsed
        .mul(tx.gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)
      const json = await env.l2Provider.send('eth_getTransactionReceipt', [
        tx.hash,
      ])
      expect(l1GasUsed).to.deep.equal(BigNumber.from(json.l1GasUsed))
      expect(l1GasPrice).to.deep.equal(BigNumber.from(json.l1GasPrice))
      expect(scaled.toString()).to.deep.equal(json.l1FeeScalar)
      expect(l1Fee).to.deep.equal(BigNumber.from(json.l1Fee))
      expect(json.l2BobaFee).to.deep.equal(txSecondaryFeeTokenFee)

      gasPrice += 1
    }
  })

  it('should compute correct fee with different price ratio for transferring Boba', async () => {
    let priceRatio = 2000
    while (priceRatio < 3000) {
      const setPriceRatio = await Boba_GasPriceOracle.connect(
        gasPriceOracleWallet
      ).updatePriceRatio(priceRatio, priceRatio)
      await setPriceRatio.wait()

      const BobaBalanceBefore = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceBefore =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

      const tx = await env.l2Wallet.sendTransaction({
        to: env.l2Wallet.address,
        value: 0,
      })
      const receipt = await tx.wait()
      const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
      const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
      const txSecondaryFeeTokenFee = receipt.gasUsed
        .mul(tx.gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)
      const json = await env.l2Provider.send('eth_getTransactionReceipt', [
        tx.hash,
      ])
      const l1NativeTokenFeeReceipt = BigNumber.from(json.l2BobaFee)
      const BobaBalanceAfter = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceAfter =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
        SecondaryFeeTokenBalanceAfter
      )
      const SecondaryFeeTokenFeeReceived =
        SecondaryFeeTokenFeeVaultBalanceAfter.sub(
          SecondaryFeeTokenFeeVaultBalanceBefore
        )
      expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
      expect(l1NativeTokenFeeReceipt).to.deep.equal(txSecondaryFeeTokenFee)
      // There is no inflation
      expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
        SecondaryFeeTokenBalanceDiff
      )

      expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
      expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

      priceRatio += 100
    }
  })

  it('should compute correct fee with different price ratio decimals for transferring Boba', async () => {
    let decimals = 0
    while (decimals < 10) {
      const setDecimals = await Boba_GasPriceOracle.connect(
        gasPriceOracleWallet
      ).updateDecimals(decimals)
      await setDecimals.wait()

      const BobaBalanceBefore = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceBefore =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

      const tx = await env.l2Wallet.sendTransaction({
        to: env.l2Wallet.address,
        value: 0,
      })
      const receipt = await tx.wait()
      const priceRatio = await Boba_GasPriceOracle.priceRatio()
      const priceRatioDivisor = BigNumber.from(10).pow(BigNumber.from(decimals))
      const txSecondaryFeeTokenFee = receipt.gasUsed
        .mul(tx.gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)
      const json = await env.l2Provider.send('eth_getTransactionReceipt', [
        tx.hash,
      ])
      const l1NativeTokenFeeReceipt = BigNumber.from(json.l2BobaFee)
      const BobaBalanceAfter = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceAfter =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
        SecondaryFeeTokenBalanceAfter
      )
      const SecondaryFeeTokenFeeReceived =
        SecondaryFeeTokenFeeVaultBalanceAfter.sub(
          SecondaryFeeTokenFeeVaultBalanceBefore
        )
      expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
      expect(l1NativeTokenFeeReceipt).to.deep.equal(txSecondaryFeeTokenFee)
      // There is no inflation
      expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
        SecondaryFeeTokenBalanceDiff
      )

      expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
      expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

      decimals += 1
    }
    await Boba_GasPriceOracle.connect(gasPriceOracleWallet).updateDecimals(1)
  })

  it('should compute correct fee with different price ratio for transferring secondary fee token', async () => {
    let priceRatio = 2000
    while (priceRatio < 3000) {
      const setPriceRatio = await Boba_GasPriceOracle.connect(
        gasPriceOracleWallet
      ).updatePriceRatio(priceRatio, priceRatio)
      await setPriceRatio.wait()

      const BobaBalanceBefore = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceBefore =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

      const tx = await secondaryFeeToken.transfer(env.l2Wallet.address, 0)
      const receipt = await tx.wait()
      const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
      const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
      const txSecondaryFeeTokenFee = receipt.gasUsed
        .mul(tx.gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)

      const json = await env.l2Provider.send('eth_getTransactionReceipt', [
        tx.hash,
      ])
      const l1NativeTokenFeeReceipt = BigNumber.from(json.l2BobaFee)
      const BobaBalanceAfter = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceAfter =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
        SecondaryFeeTokenBalanceAfter
      )
      const SecondaryFeeTokenFeeReceived =
        SecondaryFeeTokenFeeVaultBalanceAfter.sub(
          SecondaryFeeTokenFeeVaultBalanceBefore
        )
      expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
      expect(l1NativeTokenFeeReceipt).to.deep.equal(txSecondaryFeeTokenFee)
      // There is no inflation
      expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
        SecondaryFeeTokenBalanceDiff
      )

      expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
      expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

      priceRatio += 100
    }
  })

  it('should compute correct fee with different price ratio decimals for transferring secondary fee token', async () => {
    let decimals = 0
    while (decimals < 10) {
      const setDecimals = await Boba_GasPriceOracle.connect(
        gasPriceOracleWallet
      ).updateDecimals(decimals)
      await setDecimals.wait()

      const BobaBalanceBefore = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceBefore =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

      const tx = await secondaryFeeToken.transfer(env.l2Wallet.address, 0)
      const receipt = await tx.wait()
      const priceRatio = await Boba_GasPriceOracle.priceRatio()
      const priceRatioDivisor = BigNumber.from(10).pow(BigNumber.from(decimals))
      const txSecondaryFeeTokenFee = receipt.gasUsed
        .mul(tx.gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)

      const json = await env.l2Provider.send('eth_getTransactionReceipt', [
        tx.hash,
      ])
      const l1NativeTokenFeeReceipt = BigNumber.from(json.l2BobaFee)
      const BobaBalanceAfter = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceAfter =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
        SecondaryFeeTokenBalanceAfter
      )
      const SecondaryFeeTokenFeeReceived =
        SecondaryFeeTokenFeeVaultBalanceAfter.sub(
          SecondaryFeeTokenFeeVaultBalanceBefore
        )

      expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
      expect(l1NativeTokenFeeReceipt).to.deep.eq(SecondaryFeeTokenBalanceDiff)
      // There is no inflation
      expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
        SecondaryFeeTokenBalanceDiff
      )

      expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
      expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

      decimals += 1
    }
    await Boba_GasPriceOracle.connect(gasPriceOracleWallet).updateDecimals(1)
  })

  it('should pay secondary fee token to deploy contracts', async () => {
    await setPrices(env, 1000)

    const BobaBalanceBefore = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceBefore =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

    const TestContract = await Factory__Boba_GasPriceOracleProxyCall.deploy(
      Boba_GasPriceOracle.address
    )
    const receipt = await TestContract.deployTransaction.wait()
    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const decimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(BigNumber.from(decimals))
    const txSecondaryFeeTokenFee = receipt.gasUsed
      .mul(BigNumber.from(1000))
      .mul(priceRatio)
      .div(priceRatioDivisor)
    const json = await env.l2Provider.send('eth_getTransactionReceipt', [
      receipt.transactionHash,
    ])
    const l1NativeTokenFeeReceipt = BigNumber.from(json.l2BobaFee)
    const BobaBalanceAfter = await env.l2Wallet.getBalance()
    const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
      env.l2Wallet.address
    )
    const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      predeploys.OVM_SequencerFeeVault
    )
    const SecondaryFeeTokenFeeVaultBalanceAfter =
      await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
    const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
      SecondaryFeeTokenBalanceAfter
    )
    const SecondaryFeeTokenFeeReceived =
      SecondaryFeeTokenFeeVaultBalanceAfter.sub(
        SecondaryFeeTokenFeeVaultBalanceBefore
      )
    expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
    expect(l1NativeTokenFeeReceipt).to.deep.equal(txSecondaryFeeTokenFee)
    // There is no inflation
    expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
      SecondaryFeeTokenBalanceDiff
    )

    expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
    expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

    await setPrices(env, 1)
  })

  it('should pay secondary fee token to deploy contracts for different gas limit', async () => {
    await setPrices(env, 1000)

    const data = Factory__Boba_GasPriceOracleProxyCall.getDeployTransaction(
      Boba_GasPriceOracle.address
    )
    const estimatedGas = await env.l2Wallet.estimateGas(data)

    let gasLimit = estimatedGas.toNumber()
    while (gasLimit < estimatedGas.toNumber() + 10000) {
      const BobaBalanceBefore = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceBefore =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)

      const TestContract = await Factory__Boba_GasPriceOracleProxyCall.deploy(
        Boba_GasPriceOracle.address
      )
      const receipt = await TestContract.deployTransaction.wait()
      const priceRatio = await Boba_GasPriceOracle.priceRatio()
      const decimals = await Boba_GasPriceOracle.decimals()
      const priceRatioDivisor = BigNumber.from(10).pow(BigNumber.from(decimals))
      const txSecondaryFeeTokenFee = receipt.gasUsed
        .mul(BigNumber.from(1000))
        .mul(priceRatio)
        .div(priceRatioDivisor)
      const json = await env.l2Provider.send('eth_getTransactionReceipt', [
        receipt.transactionHash,
      ])
      const l1NativeTokenFeeReceipt = BigNumber.from(json.l2BobaFee)
      const BobaBalanceAfter = await env.l2Wallet.getBalance()
      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        env.l2Wallet.address
      )
      const BobaFeeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
        predeploys.OVM_SequencerFeeVault
      )
      const SecondaryFeeTokenFeeVaultBalanceAfter =
        await secondaryFeeToken.balanceOf(Boba_GasPriceOracle.address)
      const SecondaryFeeTokenBalanceDiff = SecondaryFeeTokenBalanceBefore.sub(
        SecondaryFeeTokenBalanceAfter
      )
      const SecondaryFeeTokenFeeReceived =
        SecondaryFeeTokenFeeVaultBalanceAfter.sub(
          SecondaryFeeTokenFeeVaultBalanceBefore
        )
      expect(SecondaryFeeTokenBalanceDiff).to.deep.equal(txSecondaryFeeTokenFee)
      expect(l1NativeTokenFeeReceipt).to.deep.equal(txSecondaryFeeTokenFee)
      // There is no inflation
      expect(SecondaryFeeTokenFeeReceived).to.deep.equal(
        SecondaryFeeTokenBalanceDiff
      )

      expect(BobaBalanceBefore).to.deep.equal(BobaBalanceAfter)
      expect(BobaFeeVaultBalanceBefore).to.deep.equal(BobaFeeVaultBalanceAfter)

      gasLimit += 1000
    }

    await setPrices(env, 1)
  })

  it('should register to use secondary fee token as the fee token', async () => {
    // Register l1wallet for using ETH as the fee token
    const registerTx = await Boba_GasPriceOracle.useBobaAsFeeToken()
    await registerTx.wait()

    expect(
      await Boba_GasPriceOracle.secondaryFeeTokenUsers(env.l2Wallet.address)
    ).to.be.deep.eq(false)
  })

  it('should pay secondary fee token as fee with 0 BOBA in the wallet', async () => {
    const wallet = ethers.Wallet.createRandom().connect(env.l2Provider)

    const fundBobaTx = await env.l2Wallet.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther('1'),
    })
    await fundBobaTx.wait()

    const fundSecondaryFeeTokenTx = await secondaryFeeToken.transfer(
      wallet.address,
      ethers.utils.parseEther('10')
    )
    await fundSecondaryFeeTokenTx.wait()

    // Register the fee token
    const registerTx = await Boba_GasPriceOracle.connect(
      wallet
    ).useSecondaryFeeTokenAsFeeToken()
    await registerTx.wait()

    const addSecondaryFeeTokenTx = await secondaryFeeToken
      .connect(env.l2Wallet)
      .transfer(wallet.address, ethers.utils.parseEther('200'))
    await addSecondaryFeeTokenTx.wait()

    // Transfer all Boba to the original owner
    const BobaBalance = await wallet.getBalance()
    const dropBobaTx = await wallet.sendTransaction({
      to: env.l2Wallet.address,
      value: BobaBalance,
    })
    await dropBobaTx.wait()

    const BobaBalanceAfter = await wallet.getBalance()

    expect(BobaBalanceAfter).to.deep.eq(BigNumber.from('0'))
  })

  it("should revert tx if users don't have enough secondary fee token on l2", async () => {
    const wallet = ethers.Wallet.createRandom().connect(env.l2Provider)

    const fundTx = await env.l2Wallet.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther('1'),
    })
    await fundTx.wait()

    const fundSecondaryFeeTokenTx = await secondaryFeeToken.transfer(
      wallet.address,
      ethers.utils.parseEther('10')
    )
    await fundSecondaryFeeTokenTx.wait()

    // Register the fee token
    const registerTx = await Boba_GasPriceOracle.connect(
      wallet
    ).useSecondaryFeeTokenAsFeeToken()
    await registerTx.wait()

    const SecondaryFeeTokenBalance = await secondaryFeeToken.balanceOf(
      wallet.address
    )
    const estimateGas = await secondaryFeeToken
      .connect(wallet)
      .estimateGas.transfer(env.l2Wallet.address, SecondaryFeeTokenBalance)
    const priceRatio = await Boba_GasPriceOracle.priceRatio()
    const decimals = await Boba_GasPriceOracle.decimals()
    const priceRatioDivisor = BigNumber.from(10).pow(BigNumber.from(decimals))
    const returnSecondaryFeeTokenTx = await secondaryFeeToken
      .connect(wallet)
      .transfer(
        env.l2Wallet.address,
        SecondaryFeeTokenBalance.sub(
          estimateGas.mul(priceRatio).div(priceRatioDivisor)
        ),
        { gasLimit: estimateGas }
      )
    await returnSecondaryFeeTokenTx.wait()

    await expect(
      wallet.sendTransaction({
        to: env.l2Wallet.address,
        value: ethers.utils.parseEther('0.5'),
      })
    ).to.be.rejectedWith('insufficient l1 native token balance to pay for gas')
  })

  it('should return the correct receipt', async () => {
    const randomWallet = ethers.Wallet.createRandom().connect(
      env.l2Wallet.provider
    )

    const transferTx = await env.l2Wallet.sendTransaction({
      to: randomWallet.address,
      value: ethers.utils.parseEther('1'),
    })
    await transferTx.wait()

    const fundSecondaryFeeTokenTx = await secondaryFeeToken.transfer(
      randomWallet.address,
      ethers.utils.parseEther('10')
    )
    await fundSecondaryFeeTokenTx.wait()

    const registerTx = await Boba_GasPriceOracle.connect(
      randomWallet
    ).useSecondaryFeeTokenAsFeeToken()
    await registerTx.wait()

    const json = await env.l2Provider.send('eth_getTransactionReceipt', [
      registerTx.hash,
    ])
    expect(json.l2BobaFee).to.deep.equal(BigNumber.from(0))
  })

  describe('Meta transaction tests', async () => {
    let EIP712Domain: any
    let Permit: any
    let name: string
    let version: string
    let chainId: number

    before(async () => {
      EIP712Domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ]
      Permit = [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ]

      name = await secondaryFeeToken.name()
      version = '1'
      chainId = (await env.l2Provider.getNetwork()).chainId

      // Add Boba first
      await env.l2Wallet.sendTransaction({
        to: Boba_GasPriceOracle.address,
        value: ethers.utils.parseEther('10'),
      })
    })

    it('should submit the meta transaction', async () => {
      const owner = env.l2Wallet_2.address
      const spender = Boba_GasPriceOracle.address
      const receivedBOBAAmount = await Boba_GasPriceOracle.receivedBOBAAmount()
      const value = (
        await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap()
      ).toString()
      const nonce = (
        await secondaryFeeToken.nonces(env.l2Wallet_2.address)
      ).toNumber()
      const deadline = Math.floor(Date.now() / 1000) + 90
      const verifyingContract = secondaryFeeToken.address

      const data: any = {
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
      }

      const signature = ethSigUtil.signTypedData(
        Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
        { data }
      )

      const sig = ethers.utils.splitSignature(signature)

      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        env.l2Wallet_2.address
      )
      const BobaBalanceBefore = await env.l2Wallet_2.getBalance()
      const GPO_BobaBalanceBefore = await env.l2Provider.getBalance(
        Boba_GasPriceOracle.address
      )

      await Boba_GasPriceOracle.swapSecondaryFeeTokenForBOBAMetaTransaction(
        owner,
        spender,
        value,
        deadline,
        sig.v,
        sig.r,
        sig.s
      )

      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        env.l2Wallet_2.address
      )
      const BobaBalanceAfter = await env.l2Wallet_2.getBalance()
      const GPO_BobaBalanceAfter = await env.l2Provider.getBalance(
        Boba_GasPriceOracle.address
      )

      expect(SecondaryFeeTokenBalanceAfter).to.be.deep.eq(
        SecondaryFeeTokenBalanceBefore.sub(BigNumber.from(value))
      )
      expect(BobaBalanceAfter).to.be.deep.eq(
        BobaBalanceBefore.add(receivedBOBAAmount)
      )
      expect(GPO_BobaBalanceAfter).to.be.deep.eq(
        GPO_BobaBalanceBefore.sub(receivedBOBAAmount)
      )
    })

    it('should revert transaction if v, r and s are incorrect', async () => {
      const owner = env.l2Wallet_2.address
      const spender = Boba_GasPriceOracle.address
      const value = (
        await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap()
      ).toString()
      const nonce = (
        await secondaryFeeToken.nonces(env.l2Wallet_2.address)
      ).toNumber()
      const deadline = Math.floor(Date.now() / 1000) + 90
      const verifyingContract = Boba_GasPriceOracle.address

      const data: any = {
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
      }

      const signature = ethSigUtil.signTypedData(
        Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
        { data }
      )

      const sig = ethers.utils.splitSignature(signature)

      await expect(
        Boba_GasPriceOracle.swapSecondaryFeeTokenForBOBAMetaTransaction(
          owner,
          spender,
          value,
          deadline,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith('execution reverted: ERC20Permit: invalid signature')
    })

    it("should revert transaction if users don't have sufficient secondary fee token on L2", async () => {
      const owner = env.l2Wallet_2.address
      const spender = Boba_GasPriceOracle.address
      const value = (
        await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap()
      ).toString()
      const nonce = (
        await secondaryFeeToken.nonces(env.l2Wallet_2.address)
      ).toNumber()
      const deadline = Math.floor(Date.now() / 1000) + 90
      const verifyingContract = secondaryFeeToken.address

      const data: any = {
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
      }

      const signature = ethSigUtil.signTypedData(
        Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
        { data }
      )

      const sig = ethers.utils.splitSignature(signature)

      // Update fee token
      const selectETHAsFeeTokenTx = await Boba_GasPriceOracle.connect(
        env.l2Wallet_2
      ).useBobaAsFeeToken()
      await selectETHAsFeeTokenTx.wait()

      // Transfer all funds
      const bobaBalance = await secondaryFeeToken.balanceOf(
        env.l2Wallet_2.address
      )
      const transferTx = await secondaryFeeToken
        .connect(env.l2Wallet_2)
        .transfer(env.l2Wallet.address, bobaBalance)
      await transferTx.wait()

      await expect(
        Boba_GasPriceOracle.connect(
          env.l2Wallet_2
        ).swapSecondaryFeeTokenForBOBAMetaTransaction(
          owner,
          spender,
          value,
          deadline,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )

      const transferBackTx = await secondaryFeeToken
        .connect(env.l2Wallet)
        .transfer(env.l2Wallet_2.address, bobaBalance)
      await transferBackTx.wait()
    }).retries(3)

    it('should revert transaction if spender is not correct', async () => {
      const owner = env.l2Wallet_2.address
      const spender = env.addressesBOBA.FeedRegistry
      const value = (
        await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap()
      ).toString()
      const nonce = (
        await secondaryFeeToken.nonces(env.l2Wallet_2.address)
      ).toNumber()
      const deadline = Math.floor(Date.now() / 1000) + 90
      const verifyingContract = secondaryFeeToken.address

      const data: any = {
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
      }

      const signature = ethSigUtil.signTypedData(
        Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
        { data }
      )

      const sig = ethers.utils.splitSignature(signature)

      await expect(
        Boba_GasPriceOracle.swapSecondaryFeeTokenForBOBAMetaTransaction(
          owner,
          spender,
          value,
          deadline,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith('Spender is not this contract')
    })

    it('should revert transaction if value is too low', async () => {
      const owner = env.l2Wallet_2.address
      const spender = Boba_GasPriceOracle.address
      const value = 1
      const nonce = (
        await secondaryFeeToken.nonces(env.l2Wallet_2.address)
      ).toNumber()
      const deadline = Math.floor(Date.now() / 1000) + 90
      const verifyingContract = secondaryFeeToken.address

      const data: any = {
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
      }

      const signature = ethSigUtil.signTypedData(
        Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
        { data }
      )

      const sig = ethers.utils.splitSignature(signature)

      await expect(
        Boba_GasPriceOracle.swapSecondaryFeeTokenForBOBAMetaTransaction(
          owner,
          spender,
          value,
          deadline,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith('Value is not enough')
    })

    it('should swap secondary fee token for BOBA using secondary fee token as the fee token', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)

      // Use secondary fee token as the fee token
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('100'),
      })
      await secondaryFeeToken.transfer(
        newWallet.address,
        ethers.utils.parseEther('100')
      )
      await Boba_GasPriceOracle.connect(
        newWallet
      ).useSecondaryFeeTokenAsFeeToken()

      // Get BOBA
      await secondaryFeeToken.transfer(
        newWallet.address,
        ethers.utils.parseEther('100')
      )

      // Transfer BOBA back
      const BobaBalance = await newWallet.getBalance()
      await newWallet.sendTransaction({
        to: env.l2Wallet.address,
        value: BobaBalance,
      })

      const SecondaryFeeTokenBalanceBefore = await secondaryFeeToken.balanceOf(
        newWallet.address
      )
      const BobaBalanceBefore = await newWallet.getBalance()
      const GPO_BobaBalanceBefore = await env.l2Provider.getBalance(
        Boba_GasPriceOracle.address
      )

      const owner = newWallet.address
      const spender = Boba_GasPriceOracle.address
      const receivedBOBAAmount = await Boba_GasPriceOracle.receivedBOBAAmount()
      const value = (
        await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap()
      ).toString()
      const nonce = (
        await secondaryFeeToken.nonces(newWallet.address)
      ).toNumber()
      const deadline = Math.floor(Date.now() / 1000) + 90
      const verifyingContract = secondaryFeeToken.address

      const data: any = {
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
      }

      const signature = ethSigUtil.signTypedData(
        Buffer.from(newWallet.privateKey.slice(2), 'hex'),
        { data }
      )

      const sig = ethers.utils.splitSignature(signature)

      await Boba_GasPriceOracle.swapSecondaryFeeTokenForBOBAMetaTransaction(
        owner,
        spender,
        value,
        deadline,
        sig.v,
        sig.r,
        sig.s
      )

      const SecondaryFeeTokenBalanceAfter = await secondaryFeeToken.balanceOf(
        newWallet.address
      )
      const BobaBalanceAfter = await newWallet.getBalance()
      const GPO_BobaBalanceAfter = await env.l2Provider.getBalance(
        Boba_GasPriceOracle.address
      )

      expect(SecondaryFeeTokenBalanceAfter).to.be.deep.eq(
        SecondaryFeeTokenBalanceBefore.sub(BigNumber.from(value))
      )
      expect(BobaBalanceAfter).to.be.deep.eq(
        BobaBalanceBefore.add(receivedBOBAAmount)
      )
      expect(GPO_BobaBalanceAfter).to.be.deep.eq(
        GPO_BobaBalanceBefore.sub(receivedBOBAAmount)
      )
    })

    it('should retrieve Boba', async () => {
      const feeWallet = await Boba_GasPriceOracle.feeWallet()
      const BobaBalanceBefore = await env.l2Provider.getBalance(feeWallet)
      const GPO_BobaBalanceBefore = await env.l2Provider.getBalance(
        Boba_GasPriceOracle.address
      )

      await Boba_GasPriceOracle.connect(gasPriceOracleWallet).withdrawBOBA()

      const BobaBalanceAfter = await env.l2Provider.getBalance(feeWallet)
      const GPO_BobaBalanceAfter = await env.l2Provider.getBalance(
        Boba_GasPriceOracle.address
      )

      expect(BobaBalanceAfter).to.be.eq(
        BobaBalanceBefore.add(GPO_BobaBalanceBefore)
      )
      expect(GPO_BobaBalanceAfter).to.be.eq(BigNumber.from(0))
    })
  })
})
