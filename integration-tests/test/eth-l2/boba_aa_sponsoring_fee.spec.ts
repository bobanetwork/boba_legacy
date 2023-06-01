import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, BigNumber, Wallet } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat, defaultAbiCoder } from 'ethers/lib/utils'
// use local sdk
import { SimpleAccountAPI } from '@bobanetwork/bundler_sdk'
import SimpleAccountFactoryJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import SenderCreatorJson from '@boba/accountabstraction/artifacts/contracts/core/SenderCreator.sol/SenderCreator.json'
import { HttpRpcClient } from '@bobanetwork/bundler_sdk/dist/HttpRpcClient'
import EntryPointWrapperJson from '@boba/accountabstraction/artifacts/contracts/bundler/EntryPointWrapper.sol/EntryPointWrapper.json'

import VerifyingPaymasterJson from '@boba/accountabstraction/artifacts/contracts/samples/VerifyingPaymaster.sol/VerifyingPaymaster.json'

describe('Sponsoring Tx\n', async () => {
  let env: OptimismEnv
  let SimpleAccount__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let VerifyingPaymaster__factory: ContractFactory
  let VerifyingPaymaster: Contract

  let SampleRecipient__factory: ContractFactory

  let EntryPoint: Contract

  let offchainSigner: Wallet

  before(async () => {
    env = await OptimismEnv.new()
    entryPointAddress = env.addressesAABOBA.L2_Boba_EntryPoint

    SampleRecipient__factory = new ContractFactory(
      SampleRecipientJson.abi,
      SampleRecipientJson.bytecode,
      env.l2Wallet
    )

    recipient = await SampleRecipient__factory.deploy()

    bundlerProvider = new HttpRpcClient(
      env.bundlerUrl,
      entryPointAddress,
      await env.l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )

    SimpleAccount__factory = new ContractFactory(
      SimpleAccountFactoryJson.abi,
      SimpleAccountFactoryJson.bytecode,
      env.l2Wallet_4
    )

    VerifyingPaymaster__factory = new ContractFactory(
      VerifyingPaymasterJson.abi,
      VerifyingPaymasterJson.bytecode,
      env.l2Wallet
    )

    offchainSigner = env.l2Wallet_2
    VerifyingPaymaster = await VerifyingPaymaster__factory.deploy(
      entryPointAddress,
      // ethPrice oracle
      offchainSigner.address
    )

    EntryPoint = new Contract(
      entryPointAddress,
      EntryPointJson.abi,
      env.l2Wallet
    )
  })
  describe('A user has no fee token, but pays for a transaction through a willing paymaster\n', async () => {
    let accountAPI: SimpleAccountAPI
    let signedOp
    let account

    before(
      'the paymaster operator sets up the paymaster by staking and adding deposits',
      async () => {
        await VerifyingPaymaster.addStake(1, { value: utils.parseEther('2') })
        await EntryPoint.depositTo(VerifyingPaymaster.address, {
          value: utils.parseEther('1'),
        })
      }
    )
    before('account is created and accountAPI is setup', async () => {
      // deploy a 4337 Wallet and send operation to this wallet
      const accountFactory = await SimpleAccount__factory.deploy(
        entryPointAddress
      )
      await accountFactory.deployed()
      console.log('Account Factory deployed to:', accountFactory.address)

      const EntryPointWrapper__factory = new ContractFactory(
        EntryPointWrapperJson.abi,
        EntryPointWrapperJson.bytecode,
        env.l2Wallet_4
      )

      const entryPointWrapper = await EntryPointWrapper__factory.deploy(
        entryPointAddress
      )

      accountAPI = new SimpleAccountAPI({
        provider: env.l2Provider,
        entryPointAddress,
        entryPointWrapperAddress: entryPointWrapper.address,
        owner: env.l2Wallet_4,
        factoryAddress: accountFactory.address,
      })
    })
    it('should be able to submit a userOp to the bundler and trigger tx', async () => {
      const validUntil =
        (await env.l2Provider.getBlock('latest')).timestamp + 600
      const validAfter =
        (await env.l2Provider.getBlock('latest')).timestamp - 600
      const op = await accountAPI.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
      })

      // add preverificaiton gas to account for paymaster signature
      op.paymasterAndData = hexConcat([
        VerifyingPaymaster.address,
        defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]),
        '0x' + '00'.repeat(65),
      ])
      op.preVerificationGas = BigNumber.from(await op.preVerificationGas).add(
        3000
      )
      const hash = await VerifyingPaymaster.getHash(op, validUntil, validAfter)
      const sig = await offchainSigner.signMessage(utils.arrayify(hash))

      op.paymasterAndData = hexConcat([
        VerifyingPaymaster.address,
        defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]),
        sig,
      ])
      const res = await VerifyingPaymaster.parsePaymasterAndData(
        op.paymasterAndData
      )

      expect(res.signature).to.eq(sig)
      expect(res.validAfter).to.eq(validAfter)
      expect(res.validUntil).to.eq(validUntil)
      signedOp = await accountAPI.signUserOp(op)

      const preUserBalance = await env.l2Provider.getBalance(
        env.l2Wallet_4.address
      )
      const prePaymasterDeposit = await VerifyingPaymaster.getDeposit()

      const requestId = await bundlerProvider.sendUserOpToBundler(signedOp)
      const txid = await accountAPI.getUserOpReceipt(requestId)
      console.log('reqId', requestId, 'txid=', txid)
      const receipt = await env.l2Provider.getTransactionReceipt(txid)
      const returnedlogIndex = await getFilteredLogIndex(
        receipt,
        SampleRecipientJson.abi,
        recipient.address,
        'Sender'
      )
      const log = recipient.interface.parseLog(receipt.logs[returnedlogIndex])
      // tx.origin is the bundler
      expect(log.args.txOrigin).to.eq(env.l2Wallet.address)
      // msg.sender is the 4337 wallet
      expect(log.args.msgSender).to.eq(await signedOp.sender)
      // message is received and emitted
      expect(log.args.message).to.eq('hello')

      const returnedEPlogIndex = await getFilteredLogIndex(
        receipt,
        EntryPointJson.abi,
        entryPointAddress,
        'UserOperationEvent'
      )
      const logEP = EntryPoint.interface.parseLog(
        receipt.logs[returnedEPlogIndex]
      )
      const postUserBalance = await env.l2Provider.getBalance(
        env.l2Wallet_4.address
      )
      const postPaymasterDeposit = await VerifyingPaymaster.getDeposit()

      expect(postUserBalance).to.eq(preUserBalance)
      expect(postPaymasterDeposit).to.eq(
        prePaymasterDeposit.sub(logEP.args.actualGasCost)
      )
    })

    it('should not be able to submit a userOp to the bundler and trigger tx when signature expired', async () => {
      const validUntil =
        (await env.l2Provider.getBlock('latest')).timestamp - 300
      const validAfter =
        (await env.l2Provider.getBlock('latest')).timestamp - 600
      const op = await accountAPI.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
      })

      // add preverificaiton gas to account for paymaster signature
      op.paymasterAndData = hexConcat([
        VerifyingPaymaster.address,
        defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]),
        '0x' + '00'.repeat(65),
      ])
      op.preVerificationGas = BigNumber.from(await op.preVerificationGas).add(
        3000
      )
      const hash = await VerifyingPaymaster.getHash(op, validUntil, validAfter)
      const sig = await offchainSigner.signMessage(utils.arrayify(hash))

      op.paymasterAndData = hexConcat([
        VerifyingPaymaster.address,
        defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]),
        sig,
      ])
      const res = await VerifyingPaymaster.parsePaymasterAndData(
        op.paymasterAndData
      )

      expect(res.signature).to.eq(sig)
      expect(res.validAfter).to.eq(validAfter)
      expect(res.validUntil).to.eq(validUntil)
      signedOp = await accountAPI.signUserOp(op)

      await expect(
        bundlerProvider.sendUserOpToBundler(signedOp)
      ).to.be.rejectedWith(Error, /expires too soon/)
    })

    it('should not be able to submit a userOp to the bundler and trigger tx when signature is not valid yet', async () => {
      const validUntil =
        (await env.l2Provider.getBlock('latest')).timestamp + 800
      const validAfter =
        (await env.l2Provider.getBlock('latest')).timestamp + 600
      const op = await accountAPI.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
      })

      // add preverificaiton gas to account for paymaster signature
      op.paymasterAndData = hexConcat([
        VerifyingPaymaster.address,
        defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]),
        '0x' + '00'.repeat(65),
      ])
      op.preVerificationGas = BigNumber.from(await op.preVerificationGas).add(
        3000
      )
      const hash = await VerifyingPaymaster.getHash(op, validUntil, validAfter)
      const sig = await offchainSigner.signMessage(utils.arrayify(hash))

      op.paymasterAndData = hexConcat([
        VerifyingPaymaster.address,
        defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]),
        sig,
      ])
      const res = await VerifyingPaymaster.parsePaymasterAndData(
        op.paymasterAndData
      )

      expect(res.signature).to.eq(sig)
      expect(res.validAfter).to.eq(validAfter)
      expect(res.validUntil).to.eq(validUntil)
      signedOp = await accountAPI.signUserOp(op)

      await expect(
        bundlerProvider.sendUserOpToBundler(signedOp)
      ).to.be.rejectedWith(Error, /not valid yet/)
    })
  })
})
