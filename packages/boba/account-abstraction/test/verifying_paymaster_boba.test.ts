import { Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  SimpleWallet,
  SimpleWallet__factory,
  EntryPoint,
  BobaVerifyingPaymaster,
  BobaVerifyingPaymaster__factory,
  BobaDepositPaymaster,
  BobaDepositPaymaster__factory,
  MockFeedRegistry__factory,
  MockFeedRegistry,
  TestToken,
  TestToken__factory
} from '../typechain'
import {
  createWalletOwner,
  deployEntryPoint, simulationResultCatch
} from './testutils'
import { fillAndSign } from './UserOp'
import { arrayify, hexConcat, parseEther } from 'ethers/lib/utils'

describe('EntryPoint with VerifyingPaymaster', function () {
  let entryPoint: EntryPoint
  let walletOwner: Wallet
  const ethersSigner = ethers.provider.getSigner()
  let wallet: SimpleWallet
  let offchainSigner: Wallet

  let paymaster: BobaVerifyingPaymaster
  let depositPaymaster: BobaDepositPaymaster
  let ethOracle: MockFeedRegistry
  let token: TestToken
  before(async function () {
    entryPoint = await deployEntryPoint()

    offchainSigner = createWalletOwner()
    walletOwner = createWalletOwner()

    ethOracle = await new MockFeedRegistry__factory(ethersSigner).deploy()
    token = await new TestToken__factory(ethersSigner).deploy()

    depositPaymaster = await new BobaDepositPaymaster__factory(ethersSigner).deploy(entryPoint.address, ethOracle.address)
    await depositPaymaster.addToken(token.address, ethOracle.address, token.address, 18)

    paymaster = await new BobaVerifyingPaymaster__factory(ethersSigner).deploy(entryPoint.address, offchainSigner.address, depositPaymaster.address, token.address)
    await paymaster.addStake(1, { value: parseEther('2') })
    await entryPoint.depositTo(paymaster.address, { value: parseEther('1') })
    wallet = await new SimpleWallet__factory(ethersSigner).deploy(entryPoint.address, walletOwner.address)
  })

  describe('#validatePaymasterUserOp', () => {
    it('should reject on no signature', async () => {
      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, '0x1234'])
      }, walletOwner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp)).to.be.revertedWith('invalid signature length in paymasterAndData')
    })

    it('should reject on invalid signature', async () => {
      const userOp = await fillAndSign({
        sender: wallet.address,
        paymasterAndData: hexConcat([paymaster.address, '0x' + '1c'.repeat(65)])
      }, walletOwner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp)).to.be.revertedWith('ECDSA: invalid signature')
    })

    it('should reject on unsupported calldata', async () => {
      const approveData = token.interface.encodeFunctionData('mint', [wallet.address, 1000])
      const userOp1 = await fillAndSign({
        sender: wallet.address,
        callData: wallet.interface.encodeFunctionData('execFromEntryPoint', [token.address, 0, approveData])
      }, walletOwner, entryPoint)
      const hash = await paymaster.getHash(userOp1)
      const sig = await offchainSigner.signMessage(arrayify(hash))

      const userOp = await fillAndSign({
        ...userOp1,
        paymasterAndData: hexConcat([paymaster.address, sig])
      }, walletOwner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp)).to.be.revertedWith('VerifyingPaymaster: invalid operation')
    })

    it('should reject on unsupported paymasters', async () => {
      const approveData = token.interface.encodeFunctionData('approve', [paymaster.address, ethers.constants.MaxUint256])
      const userOp1 = await fillAndSign({
        sender: wallet.address,
        callData: wallet.interface.encodeFunctionData('execFromEntryPoint', [token.address, 0, approveData])
      }, walletOwner, entryPoint)
      const hash = await paymaster.getHash(userOp1)
      const sig = await offchainSigner.signMessage(arrayify(hash))

      const userOp = await fillAndSign({
        ...userOp1,
        paymasterAndData: hexConcat([paymaster.address, sig])
      }, walletOwner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp)).to.be.revertedWith('VerifyingPaymaster: invalid operation')
    })

    it('succeed with valid signature and approve calldata', async () => {
      const approveData = token.interface.encodeFunctionData('approve', [depositPaymaster.address, ethers.constants.MaxUint256])
      const userOp1 = await fillAndSign({
        sender: wallet.address,
        callData: wallet.interface.encodeFunctionData('execFromEntryPoint', [token.address, 0, approveData])
      }, walletOwner, entryPoint)
      const hash = await paymaster.getHash(userOp1)
      const sig = await offchainSigner.signMessage(arrayify(hash))

      const userOp = await fillAndSign({
        ...userOp1,
        paymasterAndData: hexConcat([paymaster.address, sig])
      }, walletOwner, entryPoint)
      await entryPoint.callStatic.simulateValidation(userOp).catch(simulationResultCatch)
    })

    it('reject on unsupported deposit calldata', async () => {
      // amount zero for skipping approval
      const tokenAlt = await new TestToken__factory(ethersSigner).deploy()
      await depositPaymaster.addToken(tokenAlt.address, ethOracle.address, tokenAlt.address, 18)
      const depositData = depositPaymaster.interface.encodeFunctionData('addDepositFor', [tokenAlt.address, wallet.address, 0])
      const userOp1 = await fillAndSign({
        sender: wallet.address,
        // incorrect calldata
        callData: wallet.interface.encodeFunctionData('execFromEntryPoint', [depositPaymaster.address, 0, depositData])
      }, walletOwner, entryPoint)
      const hash = await paymaster.getHash(userOp1)
      const sig = await offchainSigner.signMessage(arrayify(hash))
      const userOp = await fillAndSign({
        ...userOp1,
        paymasterAndData: hexConcat([paymaster.address, sig])
      }, walletOwner, entryPoint)
      await expect(entryPoint.callStatic.simulateValidation(userOp)).to.be.revertedWith('VerifyingPaymaster: invalid operation')
    })

    it('succeed with valid signature and deposit calldata', async () => {
      // amount zero for skipping approval
      const depositData = depositPaymaster.interface.encodeFunctionData('addDepositFor', [token.address, wallet.address, 0])
      const userOp1 = await fillAndSign({
        sender: wallet.address,
        callData: wallet.interface.encodeFunctionData('execFromEntryPoint', [depositPaymaster.address, 0, depositData])
      }, walletOwner, entryPoint)
      const hash = await paymaster.getHash(userOp1)
      const sig = await offchainSigner.signMessage(arrayify(hash))
      const userOp = await fillAndSign({
        ...userOp1,
        paymasterAndData: hexConcat([paymaster.address, sig])
      }, walletOwner, entryPoint)
      await entryPoint.callStatic.simulateValidation(userOp).catch(simulationResultCatch)
    })
  })
})
