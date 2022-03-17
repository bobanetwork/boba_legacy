import { BigNumber, Contract, ContractFactory, Wallet } from 'ethers'
import { ethers } from 'hardhat'

import { expect } from './shared/setup'
import {
  fundUser,
  encodeSolidityRevertMessage,
  gasPriceForL2,
} from './shared/utils'
import { OptimismEnv } from './shared/env'

describe('Native ETH value integration tests', () => {
  let env: OptimismEnv
  let wallet: Wallet
  let other: Wallet

  before(async () => {
    env = await OptimismEnv.new()
    wallet = env.l2Wallet
    other = Wallet.createRandom().connect(wallet.provider)
  })

  it('{tag:other} should allow an L2 EOA to send to a new account and back again', async () => {
    const getBalances = async (): Promise<BigNumber[]> => {
      return [
        await wallet.provider.getBalance(wallet.address),
        await wallet.provider.getBalance(other.address),
      ]
    }

    const expectBalancesWithinRange = (
      bal: BigNumber,
      lte: BigNumber,
      gte: BigNumber
    ) => {
      expect(bal.lte(lte)).to.be.true
      expect(bal.gte(gte)).to.be.true
    }

    const value = ethers.utils.parseEther('0.01')
    await fundUser(env.messenger, value, wallet.address)

    const initialBalances = await getBalances()

    const there = await wallet.sendTransaction({
      to: other.address,
      value,
      gasPrice: await gasPriceForL2(),
    })
    const thereReceipt = await there.wait()
    const thereGas = thereReceipt.gasUsed.mul(there.gasPrice)

    const thereBalances = await getBalances()
    const thereWithGas = initialBalances[0].sub(value).sub(thereGas).sub(100000)
    expectBalancesWithinRange(
      thereBalances[0],
      initialBalances[0].sub(value),
      thereWithGas
    )
    expect(initialBalances[1].add(value).eq(thereBalances[1]))

    const backVal = ethers.utils.parseEther('0.005')
    const backAgain = await other.sendTransaction({
      to: wallet.address,
      value: backVal,
      gasPrice: await gasPriceForL2(),
    })
    const backReceipt = await backAgain.wait()
    const backGas = backReceipt.gasUsed.mul(backAgain.gasPrice)

    const backBalances = await getBalances()
    expectBalancesWithinRange(
      backBalances[0],
      initialBalances[0].sub(thereGas).sub(backVal),
      initialBalances[0].sub(thereGas).sub(backVal).sub(200000)
    )
    expectBalancesWithinRange(
      backBalances[1],
      initialBalances[1].add(backVal).sub(backGas),
      initialBalances[1].add(backVal).sub(backGas).sub(200000)
    )
  })

  describe(`calls between OVM contracts with native ETH value and relevant opcodes`, async () => {
    const initialBalance0 = 42000

    let Factory__ValueCalls: ContractFactory
    let ValueCalls0: Contract
    let ValueCalls1: Contract

    const checkBalances = async (expectedBalances: number[]) => {
      // query geth as one check
      const balance0 = await wallet.provider.getBalance(ValueCalls0.address)
      const balance1 = await wallet.provider.getBalance(ValueCalls1.address)
      expect(balance0).to.deep.eq(BigNumber.from(expectedBalances[0]))
      expect(balance1).to.deep.eq(BigNumber.from(expectedBalances[1]))
      // query ovmBALANCE() opcode via eth_call as another check
      const ovmBALANCE0 = await ValueCalls0.callStatic.getBalance(
        ValueCalls0.address
      )
      const ovmBALANCE1 = await ValueCalls0.callStatic.getBalance(
        ValueCalls1.address
      )
      expect(ovmBALANCE0).to.deep.eq(
        BigNumber.from(expectedBalances[0]),
        'geth RPC does not match ovmBALANCE'
      )
      expect(ovmBALANCE1).to.deep.eq(
        BigNumber.from(expectedBalances[1]),
        'geth RPC does not match ovmBALANCE'
      )
      // query ovmSELFBALANCE() opcode via eth_call as another check
      const ovmSELFBALANCE0 = await ValueCalls0.callStatic.getSelfBalance()
      const ovmSELFBALANCE1 = await ValueCalls1.callStatic.getSelfBalance()
      expect(ovmSELFBALANCE0).to.deep.eq(
        BigNumber.from(expectedBalances[0]),
        'geth RPC does not match ovmSELFBALANCE'
      )
      expect(ovmSELFBALANCE1).to.deep.eq(
        BigNumber.from(expectedBalances[1]),
        'geth RPC does not match ovmSELFBALANCE'
      )
      // query ovmSELFBALANCE() opcode via eth_call as another check
      const ovmEthBalanceOf0 = await env.ovmEth.balanceOf(ValueCalls0.address)
      const ovmEthBalanceOf1 = await env.ovmEth.balanceOf(ValueCalls1.address)
      expect(ovmEthBalanceOf0).to.deep.eq(
        BigNumber.from(expectedBalances[0]),
        'geth RPC does not match OVM_ETH.balanceOf'
      )
      expect(ovmEthBalanceOf1).to.deep.eq(
        BigNumber.from(expectedBalances[1]),
        'geth RPC does not match OVM_ETH.balanceOf'
      )
      // query address(this).balance solidity via eth_call as final check
      const ovmAddressThisBalance0 =
        await ValueCalls0.callStatic.getAddressThisBalance()
      const ovmAddressThisBalance01 =
        await ValueCalls1.callStatic.getAddressThisBalance()
      expect(ovmAddressThisBalance0).to.deep.eq(
        BigNumber.from(expectedBalances[0]),
        'geth RPC does not match address(this).balance'
      )
      expect(ovmAddressThisBalance01).to.deep.eq(
        BigNumber.from(expectedBalances[1]),
        'geth RPC does not match address(this).balance'
      )
    }

    before(async () => {
      Factory__ValueCalls = await ethers.getContractFactory(
        'ValueCalls',
        wallet
      )
    })

    beforeEach(async () => {
      ValueCalls0 = await Factory__ValueCalls.deploy()
      ValueCalls1 = await Factory__ValueCalls.deploy()
      await fundUser(env.messenger, initialBalance0, ValueCalls0.address)
      // These tests ass assume ValueCalls0 starts with a balance, but ValueCalls1 does not.
      await checkBalances([initialBalance0, 0])
    })

    it('{tag:other} should allow ETH to be sent', async () => {
      const sendAmount = 15
      const tx = await ValueCalls0.simpleSend(ValueCalls1.address, sendAmount, {
        gasPrice: await gasPriceForL2(),
      })
      await tx.wait()

      await checkBalances([initialBalance0 - sendAmount, sendAmount])
    })

    it('{tag:other} should revert if a function is nonpayable', async () => {
      const sendAmount = 15
      const [success, returndata] = await ValueCalls0.callStatic.sendWithData(
        ValueCalls1.address,
        sendAmount,
        ValueCalls1.interface.encodeFunctionData('nonPayable')
      )

      expect(success).to.be.false
      expect(returndata).to.eq('0x')
    })

    it('{tag:other} should allow ETH to be sent and have the correct ovmCALLVALUE', async () => {
      const sendAmount = 15
      const [success, returndata] = await ValueCalls0.callStatic.sendWithData(
        ValueCalls1.address,
        sendAmount,
        ValueCalls1.interface.encodeFunctionData('getCallValue')
      )

      expect(success).to.be.true
      expect(BigNumber.from(returndata)).to.deep.eq(BigNumber.from(sendAmount))
    })

    it('{tag:other} should have the correct ovmSELFBALANCE which includes the msg.value', async () => {
      // give an initial balance which the ovmCALLVALUE should be added to when calculating ovmSELFBALANCE
      const initialBalance = 10
      await fundUser(env.messenger, initialBalance, ValueCalls1.address)

      const sendAmount = 15
      const [success, returndata] = await ValueCalls0.callStatic.sendWithData(
        ValueCalls1.address,
        sendAmount,
        ValueCalls1.interface.encodeFunctionData('getSelfBalance')
      )

      expect(success).to.be.true
      expect(BigNumber.from(returndata)).to.deep.eq(
        BigNumber.from(initialBalance + sendAmount)
      )
    })

    it('{tag:other} should have the correct callvalue but not persist the transfer if the target reverts', async () => {
      const sendAmount = 15
      const internalCalldata = ValueCalls1.interface.encodeFunctionData(
        'verifyCallValueAndRevert',
        [sendAmount]
      )
      const [success, returndata] = await ValueCalls0.callStatic.sendWithData(
        ValueCalls1.address,
        sendAmount,
        internalCalldata
      )

      expect(success).to.be.false
      expect(returndata).to.eq(encodeSolidityRevertMessage('expected revert'))

      await checkBalances([initialBalance0, 0])
    })

    it('{tag:other} should look like the subcall reverts with no data if value exceeds balance', async () => {
      const sendAmount = initialBalance0 + 1
      const internalCalldata = ValueCalls1.interface.encodeFunctionData(
        'verifyCallValueAndReturn',
        [sendAmount] // this would be correct and return successfuly, IF it could get here
      )
      const [success, returndata] = await ValueCalls0.callStatic.sendWithData(
        ValueCalls1.address,
        sendAmount,
        internalCalldata
      )

      expect(success).to.be.false
      expect(returndata).to.eq('0x')
    })

    it('{tag:other} should preserve msg.value through ovmDELEGATECALLs', async () => {
      const Factory__ValueContext = await ethers.getContractFactory(
        'ValueContext',
        wallet
      )
      const ValueContext = await Factory__ValueContext.deploy()
      await ValueContext.deployTransaction.wait()

      const sendAmount = 10

      const [outerSuccess, outerReturndata] =
        await ValueCalls0.callStatic.sendWithData(
          ValueCalls1.address,
          sendAmount,
          ValueCalls1.interface.encodeFunctionData('delegateCallToCallValue', [
            ValueContext.address,
          ])
        )
      const [innerSuccess, innerReturndata] =
        ValueCalls1.interface.decodeFunctionResult(
          'delegateCallToCallValue',
          outerReturndata
        )
      const delegatedOvmCALLVALUE = ValueContext.interface.decodeFunctionResult(
        'getCallValue',
        innerReturndata
      )[0]

      expect(outerSuccess).to.be.true
      expect(innerSuccess).to.be.true
      expect(delegatedOvmCALLVALUE).to.deep.eq(BigNumber.from(sendAmount))
    })

    it('{tag:other} should have correct address(this).balance through ovmDELEGATECALLs to another account', async () => {
      const Factory__ValueContext = await ethers.getContractFactory(
        'ValueContext',
        wallet
      )
      const ValueContext = await Factory__ValueContext.deploy()
      await ValueContext.deployTransaction.wait()

      const [delegatedSuccess, delegatedReturndata] =
        await ValueCalls0.callStatic.delegateCallToAddressThisBalance(
          ValueContext.address
        )

      expect(delegatedSuccess).to.be.true
      expect(delegatedReturndata).to.deep.eq(BigNumber.from(initialBalance0))
    })

    it('{tag:other} should have correct address(this).balance through ovmDELEGATECALLs to same account', async () => {
      const [delegatedSuccess, delegatedReturndata] =
        await ValueCalls0.callStatic.delegateCallToAddressThisBalance(
          ValueCalls0.address
        )

      expect(delegatedSuccess).to.be.true
      expect(delegatedReturndata).to.deep.eq(BigNumber.from(initialBalance0))
    })

    it('{tag:other} should allow delegate calls which preserve msg.value even with no balance going into the inner call', async () => {
      const Factory__SendETHAwayAndDelegateCall: ContractFactory =
        await ethers.getContractFactory('SendETHAwayAndDelegateCall', wallet)
      const SendETHAwayAndDelegateCall: Contract =
        await Factory__SendETHAwayAndDelegateCall.deploy()
      await SendETHAwayAndDelegateCall.deployTransaction.wait()

      const value = 17
      const [delegatedSuccess, delegatedReturndata] =
        await SendETHAwayAndDelegateCall.callStatic.emptySelfAndDelegateCall(
          ValueCalls0.address,
          ValueCalls0.interface.encodeFunctionData('getCallValue'),
          {
            value,
          }
        )

      expect(delegatedSuccess).to.be.true
      expect(delegatedReturndata).to.deep.eq(BigNumber.from(value))
    })
  })
})
// describe('Native ETH Integration Tests', async () => {
//   let env: OptimismEnv
//   let l1Bob: Wallet
//   let l2Bob: Wallet

//   const getBalances = async (_env: OptimismEnv) => {
//     const l1UserBalance = await _env.l1Wallet.getBalance()
//     const l2UserBalance = await _env.l2Wallet.getBalance()

//     const l1BobBalance = await l1Bob.getBalance()
//     const l2BobBalance = await l2Bob.getBalance()

//     const sequencerBalance = await _env.ovmEth.balanceOf(
//       PROXY_SEQUENCER_ENTRYPOINT_ADDRESS
//     )
//     const l1BridgeBalance = await _env.l1Wallet.provider.getBalance(
//       _env.l1Bridge.address
//     )

//     return {
//       l1UserBalance,
//       l2UserBalance,
//       l1BobBalance,
//       l2BobBalance,
//       l1BridgeBalance,
//       sequencerBalance,
//     }
//   }

//   before(async () => {
//     env = await OptimismEnv.new()
//     l1Bob = Wallet.createRandom().connect(env.l1Wallet.provider)
//     l2Bob = l1Bob.connect(env.l2Wallet.provider)
//   })

//   describe('estimateGas', () => {
//     it('{tag:other} Should estimate gas for ETH withdraw', async () => {
//       const amount = utils.parseEther('0.0000001')
//       const gas = await env.l2Bridge.estimateGas.withdraw(
//         predeploys.OVM_ETH,
//         amount,
//         0,
//         '0xFFFF'
//       )
//       // Expect gas to be less than or equal to the target plus 1%
//       expectApprox(gas, 6700060, { absoluteUpperDeviation: 1000 })
//     })
//   })

//   it('{tag:other} receive', async () => {
//     const depositAmount = 10
//     const preBalances = await getBalances(env)
//     const { tx, receipt } = await env.waitForXDomainTransaction(
//       env.l1Wallet.sendTransaction({
//         to: env.l1Bridge.address,
//         value: depositAmount,
//         gasLimit: DEFAULT_TEST_GAS_L1,
//       }),
//       Direction.L1ToL2
//     )

//     const l1FeePaid = receipt.gasUsed.mul(tx.gasPrice)
//     const postBalances = await getBalances(env)

//     expect(postBalances.l1BridgeBalance).to.deep.eq(
//       preBalances.l1BridgeBalance.add(depositAmount)
//     )
//     expect(postBalances.l2UserBalance).to.deep.eq(
//       preBalances.l2UserBalance.add(depositAmount)
//     )
//     expect(postBalances.l1UserBalance).to.deep.eq(
//       preBalances.l1UserBalance.sub(l1FeePaid.add(depositAmount))
//     )
//   })

//   it('{tag:other} depositETH', async () => {
//     const depositAmount = 10
//     const preBalances = await getBalances(env)
//     const { tx, receipt } = await env.waitForXDomainTransaction(
//       env.l1Bridge.depositETH(DEFAULT_TEST_GAS_L2, '0xFFFF', {
//         value: depositAmount,
//         gasLimit: DEFAULT_TEST_GAS_L1,
//       }),
//       Direction.L1ToL2
//     )

//     const l1FeePaid = receipt.gasUsed.mul(tx.gasPrice)
//     const postBalances = await getBalances(env)

//     expect(postBalances.l1BridgeBalance).to.deep.eq(
//       preBalances.l1BridgeBalance.add(depositAmount)
//     )
//     expect(postBalances.l2UserBalance).to.deep.eq(
//       preBalances.l2UserBalance.add(depositAmount)
//     )
//     expect(postBalances.l1UserBalance).to.deep.eq(
//       preBalances.l1UserBalance.sub(l1FeePaid.add(depositAmount))
//     )
//   })

//   it('{tag:other} depositETHTo', async () => {
//     const depositAmount = 10
//     const preBalances = await getBalances(env)
//     const depositReceipts = await env.waitForXDomainTransaction(
//       env.l1Bridge.depositETHTo(l2Bob.address, DEFAULT_TEST_GAS_L2, '0xFFFF', {
//         value: depositAmount,
//         gasLimit: DEFAULT_TEST_GAS_L1,
//       }),
//       Direction.L1ToL2
//     )

//     const l1FeePaid = depositReceipts.receipt.gasUsed.mul(
//       depositReceipts.tx.gasPrice
//     )
//     const postBalances = await getBalances(env)
//     expect(postBalances.l1BridgeBalance).to.deep.eq(
//       preBalances.l1BridgeBalance.add(depositAmount)
//     )
//     expect(postBalances.l2BobBalance).to.deep.eq(
//       preBalances.l2BobBalance.add(depositAmount)
//     )
//     expect(postBalances.l1UserBalance).to.deep.eq(
//       preBalances.l1UserBalance.sub(l1FeePaid.add(depositAmount))
//     )
//   })

//   it('{tag:other} deposit passes with a large data argument', async () => {
//     const ASSUMED_L2_GAS_LIMIT = 8_000_000
//     const depositAmount = 10
//     const preBalances = await getBalances(env)

//     // Set data length slightly less than MAX_ROLLUP_TX_SIZE
//     // to allow for encoding and other arguments
//     const data = `0x` + 'ab'.repeat(MAX_ROLLUP_TX_SIZE - 500)
//     const { tx, receipt } = await env.waitForXDomainTransaction(
//       env.l1Bridge.depositETH(ASSUMED_L2_GAS_LIMIT, data, {
//         value: depositAmount,
//         gasLimit: 4_000_000,
//       }),
//       Direction.L1ToL2
//     )

//     const l1FeePaid = receipt.gasUsed.mul(tx.gasPrice)
//     const postBalances = await getBalances(env)
//     expect(postBalances.l1BridgeBalance).to.deep.eq(
//       preBalances.l1BridgeBalance.add(depositAmount)
//     )
//     expect(postBalances.l2UserBalance).to.deep.eq(
//       preBalances.l2UserBalance.add(depositAmount)
//     )
//     expect(postBalances.l1UserBalance).to.deep.eq(
//       preBalances.l1UserBalance.sub(l1FeePaid.add(depositAmount))
//     )
//   })

//   it('{tag:other} depositETH fails with a TOO large data argument', async () => {
//     const depositAmount = 10

//     const data = `0x` + 'ab'.repeat(MAX_ROLLUP_TX_SIZE + 1)
//     await expect(
//       env.l1Bridge.depositETH(DEFAULT_TEST_GAS_L2, data, {
//         value: depositAmount,
//       })
//     ).to.be.reverted
//   })

//   it('{tag:other} withdraw', async function () {
//     await useDynamicTimeoutForWithdrawals(this, env)

//     const withdrawAmount = BigNumber.from(3)
//     const preBalances = await getBalances(env)
//     expect(
//       preBalances.l2UserBalance.gt(0),
//       'Cannot run withdrawal test before any deposits...'
//     )

//     const transaction = await env.l2Bridge.withdraw(
//       predeploys.OVM_ETH,
//       withdrawAmount,
//       DEFAULT_TEST_GAS_L2,
//       '0xFFFF'
//     )
//     await transaction.wait()
//     await env.relayXDomainMessages(transaction)
//     const receipts = await env.waitForXDomainTransaction(
//       transaction,
//       Direction.L2ToL1
//     )
//     const fee = receipts.tx.gasLimit.mul(receipts.tx.gasPrice)

//     const postBalances = await getBalances(env)

//     // Approximate because there's a fee related to relaying the L2 => L1 message and it throws off the math.
//     expectApprox(
//       postBalances.l1BridgeBalance,
//       preBalances.l1BridgeBalance.sub(withdrawAmount),
//       { percentUpperDeviation: 1 }
//     )
//     expectApprox(
//       postBalances.l2UserBalance,
//       preBalances.l2UserBalance.sub(withdrawAmount.add(fee)),
//       { percentUpperDeviation: 1 }
//     )
//     expectApprox(
//       postBalances.l1UserBalance,
//       preBalances.l1UserBalance.add(withdrawAmount),
//       { percentUpperDeviation: 1 }
//     )
//   })

//   it('{tag:other} withdrawTo', async function () {
//     await useDynamicTimeoutForWithdrawals(this, env)

//     const withdrawAmount = BigNumber.from(3)

//     const preBalances = await getBalances(env)

//     expect(
//       preBalances.l2UserBalance.gt(0),
//       'Cannot run withdrawal test before any deposits...'
//     )

//     const transaction = await env.l2Bridge.withdrawTo(
//       predeploys.OVM_ETH,
//       l1Bob.address,
//       withdrawAmount,
//       DEFAULT_TEST_GAS_L2,
//       '0xFFFF'
//     )

//     await transaction.wait()
//     await env.relayXDomainMessages(transaction)
//     const receipts = await env.waitForXDomainTransaction(
//       transaction,
//       Direction.L2ToL1
//     )

//     const fee = receipts.tx.gasPrice.mul(receipts.receipt.gasUsed)

//     // Calculate the L1 portion of the fee
//     const raw = serialize({
//       nonce: transaction.nonce,
//       value: transaction.value,
//       gasPrice: transaction.gasPrice,
//       gasLimit: transaction.gasLimit,
//       to: transaction.to,
//       data: transaction.data,
//     })

//     const postBalances = await getBalances(env)

//     expect(postBalances.l1BridgeBalance).to.deep.eq(
//       preBalances.l1BridgeBalance.sub(withdrawAmount),
//       'L1 Bridge Balance Mismatch'
//     )

//     expect(postBalances.l2UserBalance).to.deep.eq(
//       preBalances.l2UserBalance.sub(withdrawAmount.add(fee)),
//       'L2 User Balance Mismatch'
//     )

//     expect(postBalances.l1BobBalance).to.deep.eq(
//       preBalances.l1BobBalance.add(withdrawAmount),
//       'L1 User Balance Mismatch'
//     )
//   })

//   it('{tag:other} deposit, transfer, withdraw', async function () {
//     await useDynamicTimeoutForWithdrawals(this, env)

//     // 1. deposit
//     const amount = utils.parseEther('1')
//     await env.waitForXDomainTransaction(
//       env.l1Bridge.depositETH(DEFAULT_TEST_GAS_L2, '0xFFFF', {
//         value: amount,
//         gasLimit: DEFAULT_TEST_GAS_L1,
//       }),
//       Direction.L1ToL2
//     )

//     // 2. transfer to another address
//     const other = Wallet.createRandom().connect(env.l2Wallet.provider)
//     const tx = await env.l2Wallet.sendTransaction({
//       to: other.address,
//       value: amount,
//     })
//     await tx.wait()

//     const l1BalanceBefore = await other
//       .connect(env.l1Wallet.provider)
//       .getBalance()

//     // 3. do withdrawal
//     const withdrawnAmount = utils.parseEther('0.5')
//     const transaction = await env.l2Bridge
//       .connect(other)
//       .withdraw(
//         predeploys.OVM_ETH,
//         withdrawnAmount,
//         DEFAULT_TEST_GAS_L1,
//         '0xFFFF'
//       )
//     await transaction.wait()
//     await env.relayXDomainMessages(transaction)
//     const receipts = await env.waitForXDomainTransaction(
//       transaction,
//       Direction.L2ToL1
//     )

//     // check that correct amount was withdrawn and that fee was charged
//     const fee = receipts.tx.gasPrice.mul(receipts.receipt.gasUsed)

//     const l1BalanceAfter = await other
//       .connect(env.l1Wallet.provider)
//       .getBalance()
//     const l2BalanceAfter = await other.getBalance()
//     expect(l1BalanceAfter).to.deep.eq(l1BalanceBefore.add(withdrawnAmount))
//     expect(l2BalanceAfter).to.deep.eq(amount.sub(withdrawnAmount).sub(fee))
//   })
// })
