import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils } from 'ethers'

import { getFilteredLogIndex, l2Wallet } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { SimpleAccountAPI, wrapProvider } from '@bobanetwork/bundler_sdk'
import SimpleAccountFactoryJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import EntryPointWrapperJson from '@boba/accountabstraction/artifacts/contracts/bundler/EntryPointWrapper.sol/EntryPointWrapper.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@bobanetwork/bundler_sdk/dist/HttpRpcClient'

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
      SimpleAccountFactoryJson.abi,
      SimpleAccountFactoryJson.bytecode,
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
    const accountFactory = await SimpleAccount__factory.deploy(
      entryPointAddress,
      { gasLimit: 9_500_000 }
    )
    await accountFactory.deployed()
    console.log('Account Factory deployed to:', accountFactory.address)
    await accountFactory.createAccount(env.l2Wallet.address, 0)
    const account = await accountFactory.getAddress(env.l2Wallet.address, 0)
    console.log('Account deployed to:', account)

    await env.l2Wallet.sendTransaction({
      value: utils.parseEther('2'),
      to: account,
    })

    const accountAPI = new SimpleAccountAPI({
      provider: env.l2Provider,
      entryPointAddress,
      owner: env.l2Wallet,
      accountAddress: account,
    })

    const op = await accountAPI.createSignedUserOp({
      target: recipient.address,
      data: recipient.interface.encodeFunctionData('something', ['hello']),
    })

    expect(await op.sender).to.be.eq(account)

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
    expect(log.args.msgSender).to.eq(account)
    // message is received and emitted
    expect(log.args.message).to.eq('hello')
  })
  it('should be able to send a userOperation to a wallet through the bundler (high level api)', async () => {
    // deploy an entryPointWrapper contract to get the create2 address on the provide
    const EntryPointWrapper__factory = new ContractFactory(
      EntryPointWrapperJson.abi,
      EntryPointWrapperJson.bytecode,
      env.l2Wallet
    )

    const entryPointWrapper = await EntryPointWrapper__factory.deploy(
      entryPointAddress
    )

    const aasigner = env.l2Provider.getSigner()
    const config = {
      chainId: await env.l2Provider.getNetwork().then((net) => net.chainId),
      entryPointAddress,
      bundlerUrl: env.bundlerUrl,
    }

    const aaProvider = await wrapProvider(
      env.l2Provider,
      config,
      aasigner,
      entryPointWrapper.address,
      env.l2Wallet_3
    )

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
    const accountFactory = await SimpleAccount__factory.deploy(
      entryPointAddress
    )
    await accountFactory.deployed()
    console.log('Account Factory deployed to:', accountFactory.address)

    // deploy an entryPointWrapper contract to get the create2 address on the provide
    const EntryPointWrapper__factory = new ContractFactory(
      EntryPointWrapperJson.abi,
      EntryPointWrapperJson.bytecode,
      env.l2Wallet
    )

    const entryPointWrapper = await EntryPointWrapper__factory.deploy(
      entryPointAddress
    )

    const accountAPI = new SimpleAccountAPI({
      provider: env.l2Provider,
      entryPointAddress,
      entryPointWrapperAddress: entryPointWrapper.address,
      owner: env.l2Wallet_2,
      factoryAddress: accountFactory.address,
    })

    const accountAddress = await accountAPI.getAccountAddress()
    // computed address is correct
    expect(accountAddress).to.be.eq(
      await accountFactory.getAddress(env.l2Wallet_2.address, 0)
    )

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
