import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils } from 'ethers'

import { getFilteredLogIndex, l2Wallet } from './shared/utils'

import { OptimismEnv } from './shared/env'
// use local sdk
import { SimpleAccountAPI, wrapProvider } from '@boba/bundler_sdk'
// change this to using factory
import SimpleAccountFactoryJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import SimpleAccountJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccount.sol/SimpleAccount.json'
import SenderCreatorJson from '@boba/accountabstraction/artifacts/contracts/core/SenderCreator.sol/SenderCreator.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@boba/bundler_sdk/dist/HttpRpcClient'

describe('AA Wallet Test\n', async () => {
  let env: OptimismEnv
  let SimpleAccount__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let SampleRecipient__factory: ContractFactory

  before(async () => {
    env = await OptimismEnv.new()
    entryPointAddress = env.addressesAABOBA.L2_BOBA_EntryPoint

    SimpleAccount__factory = new ContractFactory(
      SimpleAccountJson.abi,
      SimpleAccountJson.bytecode,
      env.l2Wallet
    )

    SampleRecipient__factory = new ContractFactory(
      SampleRecipientJson.abi,
      SampleRecipientJson.bytecode,
      env.l2Wallet
    )

    recipient = await SampleRecipient__factory.deploy()
    console.log('recipient', recipient.address)

    bundlerProvider = new HttpRpcClient(
      env.bundlerUrl,
      entryPointAddress,
      await env.l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )
  })
  it('should be able to send a userOperation to a wallet through the bundler (low level api)', async () => {
    // deploy a 4337 Wallet and send operation to this wallet
    const account = await SimpleAccount__factory.deploy(
      entryPointAddress
    )
    await account.deployed()

    console.log('Account deployed to:', account.address)

    await env.l2Wallet.sendTransaction({
      value: utils.parseEther('2'),
      to: account.address,
    })

    const accountAPI = new SimpleAccountAPI({
      provider: env.l2Provider,
      entryPointAddress,
      owner: env.l2Wallet,
      walletAddress: account.address,
    })

    const op = await accountAPI.createSignedUserOp({
      target: recipient.address,
      data: recipient.interface.encodeFunctionData('something', ['hello']),
    })

    expect(await op.sender).to.be.eq(account.address)

    const requestId = await bundlerProvider.sendUserOpToBundler(op)
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
  })
  it('should be able to send a userOperation to a wallet through the bundler (high level api)', async () => {
    // deploy a senderCreator contract to get the create2 address on the provide
    const SenderCreator__factory = new ContractFactory(
        SenderCreatorJson.abi,
        SenderCreatorJson.bytecode,
        env.l2Wallet
    )

    const senderCreator = await SenderCreator__factory.deploy()

    const aasigner = env.l2Provider.getSigner()
    const config = {
    chainId: await env.l2Provider.getNetwork().then(net => net.chainId),
    entryPointAddress,
    bundlerUrl: env.bundlerUrl
    }

    const aaProvider = await wrapProvider(env.l2Provider, config, aasigner, env.l2Wallet_3, senderCreator.address)

    const walletAddress = await aaProvider.getSigner().getAddress()
    await env.l2Wallet.sendTransaction({
        value: utils.parseEther('2'),
        to: walletAddress,
    })

    recipient = recipient.connect(aaProvider.getSigner())
    const tx = await recipient.something('hello')
    const receipt = await tx.wait()
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
    expect(log.args.msgSender).to.eq(walletAddress)
    // message is received and emitted
    expect(log.args.message).to.eq('hello')
  })
  it('should deploy a wallet if it does not exist through initCode', async () => {
    // Deploy WalletDeployer
    const simpleAccount__factory = new ContractFactory(
      SimpleAccountFactoryJson.abi,
      SimpleAccountFactoryJson.bytecode,
      env.l2Wallet_2
    )
    const simpleAccount = await simpleAccount__factory.deploy(entryPointAddress)
    console.log('factory deployed to', simpleAccount.address)

    // deploy a senderCreator contract to get the create2 address on the provide
    const SenderCreator__factory = new ContractFactory(
        SenderCreatorJson.abi,
        SenderCreatorJson.bytecode,
        env.l2Wallet
    )

    const senderCreator = await SenderCreator__factory.deploy()

    const accountAPI = new SimpleAccountAPI({
      provider: env.l2Provider,
      entryPointAddress,
      senderCreatorAddress: senderCreator.address,
      owner: env.l2Wallet_2,
      factoryAddress: simpleAccount.address,
    })

    const accountAddress = await accountAPI.getWalletAddress()
    // computed address is correct
    expect(accountAddress).to.be.eq(await simpleAccount.getAddress(entryPointAddress, env.l2Wallet_2.address, 0))

    await env.l2Wallet.sendTransaction({
      value: utils.parseEther('2'),
      to: accountAddress,
    })

    const op = await accountAPI.createSignedUserOp({
      target: recipient.address,
      data: recipient.interface.encodeFunctionData('something', ['hello']),
    })

    expect(await op.sender).to.be.eq(accountAddress)
    const preAccountCode = await env.l2Provider.getCode(op.sender)
    expect(preAccountCode).to.be.eq('0x')

    const requestId = await bundlerProvider.sendUserOpToBundler(op)
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
    expect(log.args.msgSender).to.eq(accountAddress)
    // message is received and emitted
    expect(log.args.message).to.eq('hello')

    const postAccountCode = await env.l2Provider.getCode(op.sender)
    expect(postAccountCode).to.be.not.eq('0x')
  })
})
