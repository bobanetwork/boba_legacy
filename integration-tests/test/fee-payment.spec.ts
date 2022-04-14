/* Imports: External */
import { ethers, BigNumber, Contract, utils, ContractFactory } from 'ethers'
import { sleep } from '@eth-optimism/core-utils'
import { serialize } from '@ethersproject/transactions'
import { predeploys, getContractFactory } from '@eth-optimism/contracts'

/* Imports: Internal */
import { expect } from './shared/setup'
import { hardhatTest, gasPriceOracleWallet } from './shared/utils'
import { OptimismEnv } from './shared/env'

/* Imports: ABI */
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'

const initialSupply = utils.parseEther('10000000000')
const tokenName = 'JLKN'
const tokenSymbol = 'JLKN'

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

describe('Fee Payment Integration Tests', async () => {
  let env: OptimismEnv

  let Factory__L2ERC20: ContractFactory
  let L2ERC20: Contract

  const other = '0x1234123412341234123412341234123412341234'

  before(async () => {
    env = await OptimismEnv.new()

    Factory__L2ERC20 = new ContractFactory(
      L1ERC20Json.abi,
      L1ERC20Json.bytecode,
      env.l2Wallet
    )
    L2ERC20 = await Factory__L2ERC20.deploy(
      initialSupply,
      tokenName,
      tokenSymbol,
      18
    )
    await L2ERC20.deployTransaction.wait()
  })

  hardhatTest(
    `{tag:other} should return eth_gasPrice equal to OVM_GasPriceOracle.gasPrice`,
    async () => {
      const assertGasPrice = async () => {
        const gasPrice = await env.l2Wallet.getGasPrice()
        const oracleGasPrice =
          await env.messenger.contracts.l2.OVM_GasPriceOracle.connect(
            gasPriceOracleWallet
          ).gasPrice()
        expect(gasPrice).to.deep.equal(oracleGasPrice)
      }

      await assertGasPrice()
      // update the gas price
      const tx = await env.messenger.contracts.l2.OVM_GasPriceOracle.connect(
        gasPriceOracleWallet
      ).setGasPrice(1000)
      await tx.wait()

      await assertGasPrice()
    }
  )

  it('{tag:other} Paying a nonzero but acceptable gasPrice fee', async () => {
    await setPrices(env, 1000)

    const amount = utils.parseEther('0.0000001')
    const balanceBefore = await env.l2Wallet.getBalance()
    const feeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      env.messenger.contracts.l2.OVM_SequencerFeeVault.address
      //env.sequencerFeeVault.address
    )
    expect(balanceBefore.gt(amount))

    const unsigned = await env.l2Wallet.populateTransaction({
      to: other,
      value: amount,
      gasLimit: 500000,
    })

    const tx = await env.l2Wallet.sendTransaction(unsigned)
    const receipt = await tx.wait()
    expect(receipt.status).to.eq(1)

    const balanceAfter = await env.l2Wallet.getBalance()
    const feeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      env.messenger.contracts.l2.OVM_SequencerFeeVault.address
      //env.sequencerFeeVault.address
    )

    const txFee = receipt.gasUsed.mul(tx.gasPrice)

    expect(balanceBefore.sub(balanceAfter)).to.deep.equal(amount.add(txFee))

    // Make sure the fee was transferred to the vault.
    expect(feeVaultBalanceAfter.sub(feeVaultBalanceBefore)).to.deep.equal(txFee)

    await setPrices(env, 1)
  })

  it('{tag:other} should compute correct fee', async () => {
    await setPrices(env, 1000)

    const preBalance = await env.l2Wallet.getBalance()

    const WETH = getContractFactory('OVM_ETH')
      .attach(predeploys.OVM_ETH)
      .connect(env.l2Wallet)

    const feeVaultBefore = await WETH.balanceOf(
      predeploys.OVM_SequencerFeeVault
    )

    const unsigned = await env.l2Wallet.populateTransaction({
      to: env.l2Wallet.address,
      value: 0,
    })

    const tx = await env.l2Wallet.sendTransaction(unsigned)
    const receipt = await tx.wait()
    const fee = receipt.gasUsed.mul(tx.gasPrice)
    const postBalance = await env.l2Wallet.getBalance()
    const feeVaultAfter = await WETH.balanceOf(predeploys.OVM_SequencerFeeVault)
    const balanceDiff = preBalance.sub(postBalance)
    const feeReceived = feeVaultAfter.sub(feeVaultBefore)
    expect(balanceDiff).to.deep.equal(fee)
    // There is no inflation
    expect(feeReceived).to.deep.equal(balanceDiff)

    await setPrices(env, 1)
  })

  it('{tag:other} should compute correct fee with different gas limit', async () => {
    await setPrices(env, 1000)

    const WETH = getContractFactory('OVM_ETH')
      .attach(predeploys.OVM_ETH)
      .connect(env.l2Wallet)

    const estimatedGas = await L2ERC20.estimateGas.transfer(
      env.l2Wallet.address,
      ethers.utils.parseEther('1')
    )
    let gasLimit = estimatedGas.toNumber() - 1000

    while (gasLimit < estimatedGas.toNumber() + 1000) {
      const preBalance = await env.l2Wallet.getBalance()

      const feeVaultBefore = await WETH.balanceOf(
        predeploys.OVM_SequencerFeeVault
      )

      const tx = await L2ERC20.transfer(
        env.l2Wallet.address,
        ethers.utils.parseEther('1')
      )
      const receipt = await tx.wait()
      const fee = receipt.gasUsed.mul(tx.gasPrice)
      const postBalance = await env.l2Wallet.getBalance()
      const feeVaultAfter = await WETH.balanceOf(
        predeploys.OVM_SequencerFeeVault
      )
      const balanceDiff = preBalance.sub(postBalance)
      const feeReceived = feeVaultAfter.sub(feeVaultBefore)

      expect(balanceDiff).to.deep.equal(fee)
      // There is no inflation
      expect(feeReceived).to.deep.equal(balanceDiff)

      gasLimit += 100
    }

    await setPrices(env, 1)
  })

  it('{tag:other} should not be able to withdraw fees before the minimum is met', async () => {
    await expect(env.messenger.contracts.l2.OVM_SequencerFeeVault.withdraw()).to
      .be.rejected
  })

  hardhatTest(
    '{tag:other} should be able to withdraw fees back to L1 once the minimum is met',
    async () => {
      const l1FeeWallet =
        await env.messenger.contracts.l2.OVM_SequencerFeeVault.l1FeeWallet()
      const balanceBefore = await env.l1Wallet.provider.getBalance(l1FeeWallet)
      const withdrawalAmount =
        await env.messenger.contracts.l2.OVM_SequencerFeeVault.MIN_WITHDRAWAL_AMOUNT()

      // Transfer the minimum required to withdraw.
      const tx = await env.l2Wallet.sendTransaction({
        to: env.messenger.contracts.l2.OVM_SequencerFeeVault.address,
        value: withdrawalAmount,
        gasLimit: 500000,
      })
      await tx.wait()

      const vaultBalance = await env.messenger.contracts.l2.OVM_ETH.balanceOf(
        env.messenger.contracts.l2.OVM_SequencerFeeVault.address
      )

      const withdrawTx =
        await env.messenger.contracts.l2.OVM_SequencerFeeVault.withdraw()

      // Wait for the withdrawal to be relayed to L1.
      await withdrawTx.wait()
      await env.relayXDomainMessages(withdrawTx)
      await env.waitForXDomainTransaction(withdrawTx)

      // Balance difference should be equal to old L2 balance.
      const balanceAfter = await env.l1Wallet.provider.getBalance(l1FeeWallet)
      expect(balanceAfter.sub(balanceBefore)).to.deep.equal(
        BigNumber.from(vaultBalance)
      )
    }
  )

  // The configuration of allowing the different gas price shouldn't go into the production
  it('{tag:other} should compute correct fee with different gas price', async () => {
    await setPrices(env, 1)

    const WETH = getContractFactory('OVM_ETH')
      .attach(predeploys.OVM_ETH)
      .connect(env.l2Wallet)

    let gasPrice = 1

    while (gasPrice < 10) {
      const preBalance = await env.l2Wallet.getBalance()

      const feeVaultBefore = await WETH.balanceOf(
        predeploys.OVM_SequencerFeeVault
      )

      const unsigned = await env.l2Wallet.populateTransaction({
        to: env.l2Wallet.address,
        value: 0,
        gasPrice,
      })

      const tx = await env.l2Wallet.sendTransaction(unsigned)
      const receipt = await tx.wait()
      const fee = receipt.gasUsed.mul(tx.gasPrice)
      const postBalance = await env.l2Wallet.getBalance()
      const feeVaultAfter = await WETH.balanceOf(
        predeploys.OVM_SequencerFeeVault
      )
      const balanceDiff = preBalance.sub(postBalance)
      const feeReceived = feeVaultAfter.sub(feeVaultBefore)
      expect(balanceDiff).to.deep.equal(fee)
      // There is no inflation
      expect(feeReceived).to.deep.equal(balanceDiff)

      gasPrice += 1
    }
  })

  // https://github.com/bobanetwork/boba/pull/22
  it('{tag:other} should be able to configure l1 gas price in a rare situation', async () => {
    // This blocks all txs, because the gas usage for the l1 security fee is too large
    const gasPrice =
      await env.messenger.contracts.l2.OVM_GasPriceOracle.connect(
        gasPriceOracleWallet
      ).setGasPrice(1)
    await gasPrice.wait()
    const baseFee = await env.messenger.contracts.l2.OVM_GasPriceOracle.connect(
      gasPriceOracleWallet
    ).setL1BaseFee(11_000_000)
    await baseFee.wait()

    // Can't transfer ETH
    await expect(
      env.l2Wallet.sendTransaction({
        to: env.l2Wallet.address,
        value: ethers.utils.parseEther('1'),
      })
    ).to.be.rejected

    // Reset L1 base fee
    const resetBaseFee =
      await env.messenger.contracts.l2.OVM_GasPriceOracle.connect(
        gasPriceOracleWallet
      ).setL1BaseFee(1, { gasPrice: 0, gasLimit: 11000000 })
    await resetBaseFee.wait()
  })
})
