import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, constants, BigNumber, Wallet } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat } from 'ethers/lib/utils'
// use local sdk
import { SimpleAccountAPI } from '@boba/bundler_sdk'
import SimpleAccountFactoryJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import SenderCreatorJson from '@boba/accountabstraction/artifacts/contracts/core/SenderCreator.sol/SenderCreator.json'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@boba/bundler_sdk/dist/HttpRpcClient'

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
    entryPointAddress = env.addressesAABOBA.L2_BOBA_EntryPoint

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
      env.l2Wallet
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

    before('the paymaster operator sets up the paymaster by staking and adding deposits', async () => {
      await VerifyingPaymaster.addStake(1, { value: utils.parseEther('2') })
      await EntryPoint.depositTo(VerifyingPaymaster.address, {
        value: utils.parseEther('1')
      })
    })
    before('account is created and accountAPI is setup', async () => {
      // deploy a 4337 Wallet and send operation to this wallet
      const factory = await SimpleAccount__factory.deploy(
        entryPointAddress
      )
      //let account = await factory.createAccount(env.l2Wallet_4.address, 0)
      // deploy a senderCreator contract to get the create2 address on the provide
      const SenderCreator__factory = new ContractFactory(
        SenderCreatorJson.abi,
        SenderCreatorJson.bytecode,
        env.l2Wallet
      )
    const senderCreator = await SenderCreator__factory.deploy()
    accountAPI = new SimpleAccountAPI({
        provider: env.l2Provider,
        entryPointAddress,
        senderCreatorAddress: senderCreator.address,
        owner: env.l2Wallet_4,
        factoryAddress: factory.address
      })
    })
//this
    it('should be able to submit a userOp to the bundler and trigger tx', async () => {
      const op = await accountAPI.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
      })
      console.log(op)
      // add preverificaiton gas to account for paymaster signature
      op.preVerificationGas = BigNumber.from(await op.preVerificationGas).add(3000)

      const MOCK_VALID_UNTIL = '0x00000000deadbeef'
      const MOCK_VALID_AFTER = '0x0000000000001234'
      const hash = await VerifyingPaymaster.getHash(op, MOCK_VALID_UNTIL, MOCK_VALID_AFTER)
      console.log('111')
      const sig = await offchainSigner.signMessage(utils.arrayify(hash))

console.log('1')
      op.paymasterAndData = hexConcat([VerifyingPaymaster.address, sig])

console.log('2')
      signedOp = await accountAPI.signUserOp(op)

console.log('3')
      const preUserBalance = await env.l2Provider.getBalance(env.l2Wallet_4.address)
      console.log('333')
      const prePaymasterDeposit = await VerifyingPaymaster.getDeposit()

console.log('4')
      const requestId = await bundlerProvider.sendUserOpToBundler(signedOp)

console.log('5')
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
      expect(log.args.msgSender).to.eq(account.address)
      // message is received and emitted
      expect(log.args.message).to.eq('hello')

      const returnedEPlogIndex = await getFilteredLogIndex(
        receipt,
        EntryPointJson.abi,
        entryPointAddress,
        'UserOperationEvent'
      )
      const logEP = EntryPoint.interface.parseLog(receipt.logs[returnedEPlogIndex])
      const postUserBalance = await env.l2Provider.getBalance(env.l2Wallet_4.address)
      const postPaymasterDeposit = await VerifyingPaymaster.getDeposit()

      expect(postUserBalance).to.eq(preUserBalance)
      expect(postPaymasterDeposit).to.eq(prePaymasterDeposit.sub(logEP.args.actualGasCost))
    })
  })
})
