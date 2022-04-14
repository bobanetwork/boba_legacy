import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

/* Imports: External */
import { ethers, BigNumber, Contract, utils } from 'ethers'
import { sleep } from '@eth-optimism/core-utils'
import { serialize } from '@ethersproject/transactions'
import {
  predeploys,
  getContractInterface,
  getContractFactory,
} from '@eth-optimism/contracts'

/* Imports: Internal */
import { IS_LIVE_NETWORK } from './shared/utils'
import { OptimismEnv } from './shared/env'
import { Direction } from './shared/watcher-utils'

const setPrices = async (env: OptimismEnv, value: number | BigNumber) => {
  const gasPrice = await env.gasPriceOracle.setGasPrice(value)
  await gasPrice.wait()
  const baseFee = await env.gasPriceOracle.setL1BaseFee(value)
  await baseFee.wait()
}

describe('Fee Payment Integration Tests', async () => {
  let env: OptimismEnv
  const other = '0x1234123412341234123412341234123412341234'

  before(async () => {
    env = await OptimismEnv.new()
  })

  it('{tag:other} should return eth_gasPrice equal to OVM_GasPriceOracle.gasPrice', async () => {
    const assertGasPrice = async () => {
      const gasPrice = await env.l2Wallet.getGasPrice()
      const oracleGasPrice = await env.gasPriceOracle.gasPrice()
      expect(gasPrice).to.deep.equal(oracleGasPrice)
    }

    assertGasPrice()
    // update the gas price
    const tx = await env.gasPriceOracle.setGasPrice(1000)
    await tx.wait()

    assertGasPrice()
  })

  it('{tag:other} Paying a nonzero but acceptable gasPrice fee', async () => {
    await setPrices(env, 1000)

    const amount = utils.parseEther('0.0000001')
    const balanceBefore = await env.l2Wallet.getBalance()
    const feeVaultBalanceBefore = await env.l2Wallet.provider.getBalance(
      env.sequencerFeeVault.address
    )
    expect(balanceBefore.gt(amount))

    const unsigned = await env.l2Wallet.populateTransaction({
      to: other,
      value: amount,
      gasLimit: 500000,
    })

    const raw = serialize({
      nonce: parseInt(unsigned.nonce.toString(10), 10),
      value: unsigned.value,
      gasPrice: unsigned.gasPrice,
      gasLimit: unsigned.gasLimit,
      to: unsigned.to,
      data: unsigned.data,
    })

    const tx = await env.l2Wallet.sendTransaction(unsigned)
    const receipt = await tx.wait()
    expect(receipt.status).to.eq(1)

    const balanceAfter = await env.l2Wallet.getBalance()
    const feeVaultBalanceAfter = await env.l2Wallet.provider.getBalance(
      env.sequencerFeeVault.address
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

    const OVM_GasPriceOracle = getContractFactory('OVM_GasPriceOracle')
      .attach(predeploys.OVM_GasPriceOracle)
      .connect(env.l2Wallet)

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

    const raw = serialize({
      nonce: parseInt(unsigned.nonce.toString(10), 10),
      value: unsigned.value,
      gasPrice: unsigned.gasPrice,
      gasLimit: unsigned.gasLimit,
      to: unsigned.to,
      data: unsigned.data,
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

  it('{tag:other} should not be able to withdraw fees before the minimum is met', async () => {
    await expect(env.sequencerFeeVault.withdraw()).to.be.rejected
  })

  it('{tag:other} should be able to withdraw fees back to L1 once the minimum is met', async function () {
    const l1FeeWallet = await env.sequencerFeeVault.l1FeeWallet()
    const balanceBefore = await env.l1Wallet.provider.getBalance(l1FeeWallet)
    const withdrawalAmount = await env.sequencerFeeVault.MIN_WITHDRAWAL_AMOUNT()

    const l2WalletBalance = await env.l2Wallet.getBalance()
    if (IS_LIVE_NETWORK && l2WalletBalance.lt(withdrawalAmount)) {
      console.log(
        `NOTICE: must have at least ${ethers.utils.formatEther(
          withdrawalAmount
        )} ETH on L2 to execute this test, skipping`
      )
      this.skip()
    }

    // Transfer the minimum required to withdraw.
    const tx = await env.l2Wallet.sendTransaction({
      to: env.sequencerFeeVault.address,
      value: withdrawalAmount,
      gasLimit: 500000,
    })
    await tx.wait()

    const vaultBalance = await env.ovmEth.balanceOf(
      env.sequencerFeeVault.address
    )

    // Submit the withdrawal.
    const withdrawTx = await env.sequencerFeeVault.withdraw({
      gasPrice: 0, // Need a gasprice of 0 or the balances will include the fee paid during this tx.
    })

    // Wait for the withdrawal to be relayed to L1.
    await env.waitForXDomainTransaction(withdrawTx, Direction.L2ToL1)

    // Balance difference should be equal to old L2 balance.
    const balanceAfter = await env.l1Wallet.provider.getBalance(l1FeeWallet)
    expect(balanceAfter.sub(balanceBefore)).to.deep.equal(
      BigNumber.from(vaultBalance)
    )
  })
})
