/* Imports: External */
import { Wallet, utils, BigNumber, Contract } from 'ethers'
import { serialize } from '@ethersproject/transactions'
import { predeploys, getContractFactory } from '@eth-optimism/contracts'
import { expectApprox } from '@eth-optimism/core-utils'

/* Imports: Internal */
import { expect } from './shared/setup'
import {
  DEFAULT_TEST_GAS_L1,
  DEFAULT_TEST_GAS_L2,
  envConfig,
  withdrawalTest,
  approveERC20,
  isAvalanche,
} from './shared/utils'
import { OptimismEnv } from './shared/env'

// TX size enforced by CTC:
const MAX_ROLLUP_TX_SIZE = 50_000

describe('Native BOBA Integration Tests', async () => {
  let env: OptimismEnv
  let l1Bob: Wallet
  let l2Bob: Wallet

  let L1BOBAToken: Contract
  let L1StandardBridge: Contract

  const getBalances = async (_env: OptimismEnv) => {
    const l1UserBalance = await L1BOBAToken.balanceOf(_env.l2Wallet.address)
    const l2UserBalance = await _env.l2Wallet.getBalance()

    const l1BobBalance = await L1BOBAToken.balanceOf(l1Bob.address)
    const l2BobBalance = await l2Bob.getBalance()

    const l1BridgeBalance = await L1BOBAToken.balanceOf(
      _env.messenger.contracts.l1.L1StandardBridge.address
    )

    return {
      l1UserBalance,
      l2UserBalance,
      l1BobBalance,
      l2BobBalance,
      l1BridgeBalance,
    }
  }

  beforeEach(async () => {
    env = await OptimismEnv.new()
    l1Bob = Wallet.createRandom().connect(env.l1Wallet.provider)
    l2Bob = l1Bob.connect(env.l2Wallet.provider)

    L1BOBAToken = getContractFactory('BOBA', env.l1Wallet).attach(
      env.addressesBOBA.TOKENS.BOBA.L1
    )

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(env.addressesBASE.Proxy__L1StandardBridge)
  })

  describe('estimateGas', () => {
    it('{tag:other} Should estimate gas for BOBA withdraw', async () => {
      const amount = utils.parseEther('0.0000001')
      const gas =
        await env.messenger.contracts.l2.L2StandardBridge.estimateGas.withdraw(
          predeploys.L2_BOBA,
          amount,
          0,
          '0xFFFF'
        )
      // Expect gas to be less than or equal to the target plus 1%
      expectApprox(gas, 6700060, { absoluteUpperDeviation: 1000 })
    })
  })

  it('{tag:other} receive BOBA', async () => {
    const depositAmount = 10
    const preBalances = await getBalances(env)
    await approveERC20(L1BOBAToken, L1StandardBridge.address, depositAmount)
    const { tx, receipt } = await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        L1BOBAToken.address,
        predeploys.L2_BOBA,
        depositAmount,
        DEFAULT_TEST_GAS_L1,
        '0xFFFF'
      )
    )

    const postBalances = await getBalances(env)

    expect(postBalances.l1BridgeBalance).to.deep.eq(
      preBalances.l1BridgeBalance.add(depositAmount)
    )
    expect(postBalances.l2UserBalance).to.deep.eq(
      preBalances.l2UserBalance.add(depositAmount)
    )
    expect(postBalances.l1UserBalance).to.deep.eq(
      preBalances.l1UserBalance.sub(depositAmount)
    )
  })

  it('{tag:other} depositERC20 BOBA', async () => {
    const depositAmount = 10
    const preBalances = await getBalances(env)
    await approveERC20(L1BOBAToken, L1StandardBridge.address, depositAmount)
    const { tx, receipt } = await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        L1BOBAToken.address,
        predeploys.L2_BOBA,
        depositAmount,
        DEFAULT_TEST_GAS_L1,
        '0xFFFF'
      )
    )

    const postBalances = await getBalances(env)

    expect(postBalances.l1BridgeBalance).to.deep.eq(
      preBalances.l1BridgeBalance.add(depositAmount)
    )
    expect(postBalances.l2UserBalance).to.deep.eq(
      preBalances.l2UserBalance.add(depositAmount)
    )
    expect(postBalances.l1UserBalance).to.deep.eq(
      preBalances.l1UserBalance.sub(depositAmount)
    )
  })

  it('{tag:other} depositERC20To BOBA', async () => {
    const depositAmount = 10
    const preBalances = await getBalances(env)
    await approveERC20(L1BOBAToken, L1StandardBridge.address, depositAmount)
    const depositReceipts = await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20To(
        L1BOBAToken.address,
        predeploys.L2_BOBA,
        l2Bob.address,
        depositAmount,
        DEFAULT_TEST_GAS_L1,
        '0xFFFF'
      )
    )

    const postBalances = await getBalances(env)
    expect(postBalances.l1BridgeBalance).to.deep.eq(
      preBalances.l1BridgeBalance.add(depositAmount)
    )
    expect(postBalances.l2BobBalance).to.deep.eq(
      preBalances.l2BobBalance.add(depositAmount)
    )
    expect(postBalances.l1UserBalance).to.deep.eq(
      preBalances.l1UserBalance.sub(depositAmount)
    )
  })

  it('{tag:other} deposit passes with a large data argument', async () => {
    const ASSUMED_L2_GAS_LIMIT = 8_000_000
    const depositAmount = 10
    const preBalances = await getBalances(env)

    // Set data length slightly less than MAX_ROLLUP_TX_SIZE
    // to allow for encoding and other arguments
    let data = `0x` + 'ab'.repeat(MAX_ROLLUP_TX_SIZE - 500)
    if (await isAvalanche(env.l2Provider)) {
      data = `0x` + 'ab'.repeat(MAX_ROLLUP_TX_SIZE - 1500)
    }
    await approveERC20(L1BOBAToken, L1StandardBridge.address, depositAmount)
    const { tx, receipt } = await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        L1BOBAToken.address,
        predeploys.L2_BOBA,
        depositAmount,
        ASSUMED_L2_GAS_LIMIT,
        data
      )
    )

    const postBalances = await getBalances(env)
    expect(postBalances.l1BridgeBalance).to.deep.eq(
      preBalances.l1BridgeBalance.add(depositAmount)
    )
    expect(postBalances.l2UserBalance).to.deep.eq(
      preBalances.l2UserBalance.add(depositAmount)
    )
    expect(postBalances.l1UserBalance).to.deep.eq(
      preBalances.l1UserBalance.sub(depositAmount)
    )
  })

  it('{tag:other} deposit BOBA fails with a TOO large data argument', async () => {
    const depositAmount = 10

    const data = `0x` + 'ab'.repeat(MAX_ROLLUP_TX_SIZE + 1)
    await approveERC20(L1BOBAToken, L1StandardBridge.address, depositAmount)
    await expect(
      L1StandardBridge.depositERC20(
        L1BOBAToken.address,
        predeploys.L2_BOBA,
        depositAmount,
        DEFAULT_TEST_GAS_L1,
        data
      )
    ).to.be.reverted
  })

  withdrawalTest('{tag:other} withdraw', async () => {
    const withdrawAmount = BigNumber.from(3)
    const preBalances = await getBalances(env)
    expect(
      preBalances.l2UserBalance.gt(0),
      'Cannot run withdrawal test before any deposits...'
    )

    const transaction =
      await env.messenger.contracts.l2.L2StandardBridge.withdraw(
        predeploys.L2_BOBA,
        withdrawAmount,
        DEFAULT_TEST_GAS_L2,
        '0xFFFF'
      )
    await transaction.wait()
    await env.relayXDomainMessages(transaction)
    const receipts = await env.waitForXDomainTransaction(transaction)
    const fee = receipts.tx.gasLimit.mul(receipts.tx.gasPrice)

    const postBalances = await getBalances(env)

    // Approximate because there's a fee related to relaying the L2 => L1 message and it throws off the math.
    expectApprox(
      postBalances.l1BridgeBalance,
      preBalances.l1BridgeBalance.sub(withdrawAmount),
      { percentUpperDeviation: 1 }
    )
    expectApprox(
      postBalances.l2UserBalance,
      preBalances.l2UserBalance.sub(withdrawAmount.add(fee)),
      { percentUpperDeviation: 1 }
    )
    expectApprox(
      postBalances.l1UserBalance,
      preBalances.l1UserBalance.add(withdrawAmount),
      { percentUpperDeviation: 1 }
    )
  })

  withdrawalTest('{tag:other} withdrawTo', async () => {
    const withdrawAmount = BigNumber.from(3)

    const preBalances = await getBalances(env)

    expect(
      preBalances.l2UserBalance.gt(0),
      'Cannot run withdrawal test before any deposits...'
    )

    const transaction =
      await env.messenger.contracts.l2.L2StandardBridge.withdrawTo(
        predeploys.L2_BOBA,
        l1Bob.address,
        withdrawAmount,
        DEFAULT_TEST_GAS_L2,
        '0xFFFF'
      )

    await transaction.wait()
    await env.relayXDomainMessages(transaction)
    const receipts = await env.waitForXDomainTransaction(transaction)

    const fee = receipts.tx.gasPrice.mul(receipts.receipt.gasUsed)

    const postBalances = await getBalances(env)

    expect(postBalances.l1BridgeBalance).to.deep.eq(
      preBalances.l1BridgeBalance.sub(withdrawAmount),
      'L1 Bridge Balance Mismatch'
    )

    expect(postBalances.l2UserBalance).to.deep.eq(
      preBalances.l2UserBalance.sub(withdrawAmount.add(fee)),
      'L2 User Balance Mismatch'
    )

    expect(postBalances.l1BobBalance).to.deep.eq(
      preBalances.l1BobBalance.add(withdrawAmount),
      'L1 User Balance Mismatch'
    )
  })

  withdrawalTest(
    '{tag:other} deposit, transfer, withdraw',
    async () => {
      // 1. deposit
      const amount = utils.parseEther('1')
      await approveERC20(L1BOBAToken, L1StandardBridge.address, amount)
      await env.waitForXDomainTransaction(
        L1StandardBridge.depositERC20(
          L1BOBAToken.address,
          predeploys.L2_BOBA,
          amount,
          DEFAULT_TEST_GAS_L1,
          '0xFFFF'
        )
      )

      // 2. transfer to another address
      const other = Wallet.createRandom().connect(env.l2Wallet.provider)
      const tx = await env.l2Wallet.sendTransaction({
        to: other.address,
        value: amount,
      })
      await tx.wait()

      const l1BalanceBefore = await L1BOBAToken.balanceOf(other.address)

      // 3. do withdrawal
      const withdrawnAmount = utils.parseEther('0.5')
      const transaction =
        await env.messenger.contracts.l2.L2StandardBridge.connect(
          other
        ).withdraw(
          predeploys.L2_BOBA,
          withdrawnAmount,
          DEFAULT_TEST_GAS_L1,
          '0xFFFF'
        )
      await transaction.wait()
      await env.relayXDomainMessages(transaction)
      const receipts = await env.waitForXDomainTransaction(transaction)

      // check that correct amount was withdrawn and that fee was charged
      const fee = receipts.tx.gasPrice.mul(receipts.receipt.gasUsed)

      const l1BalanceAfter = await L1BOBAToken.balanceOf(other.address)
      const l2BalanceAfter = await other.getBalance()
      expect(l1BalanceAfter).to.deep.eq(l1BalanceBefore.add(withdrawnAmount))
      expect(l2BalanceAfter).to.deep.eq(amount.sub(withdrawnAmount).sub(fee))
    },
    envConfig.MOCHA_TIMEOUT * 3
  )
})
