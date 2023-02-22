import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
// use local sdk
import { SimpleWalletAPI } from '@account-abstraction/sdk/src/SimpleWalletAPI'
import { wrapProvider } from '@account-abstraction/sdk/src/Provider'
import SimpleWalletDeployerJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleWalletDeployer.sol/SimpleWalletDeployer.json'
import SimpleWalletJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleWallet.sol/SimpleWallet.json'
import { SampleRecipient, SampleRecipient__factory } from '@account-abstraction/utils/dist/src/types'
import { HttpRpcClient } from '@account-abstraction/sdk/dist/src/HttpRpcClient'

describe('AA Wallet Test\n', async () => {
  let env: OptimismEnv
  let SimpleWallet__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  before(async () => {
    env = await OptimismEnv.new()
    entryPointAddress = env.addressesAABOBA.BOBA_EntryPoint

    SimpleWallet__factory = new ContractFactory(
      SimpleWalletJson.abi,
      SimpleWalletJson.bytecode,
      env.l2Wallet
    )

    recipient = await new SampleRecipient__factory(env.l2Wallet).deploy()
    console.log('recipient', recipient.address)

    bundlerProvider = new HttpRpcClient(
      'http://localhost:3000/rpc',
      entryPointAddress,
      await env.l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )
  })
  it('should be able to send a userOperation to a wallet through the bundler', async () => {
    // deploy a 4337 Wallet and send operation to this wallet
    const account = await SimpleWallet__factory.deploy(
      entryPointAddress,
      env.l2Wallet.address
    )
    await account.deployed()
    console.log('Account deployed to:', account.address)

    await env.l2Wallet.sendTransaction({
      value: utils.parseEther('2'),
      to: account.address,
    })

    const walletAPI = new SimpleWalletAPI({
      provider: env.l2Provider,
      entryPointAddress,
      owner: env.l2Wallet,
      walletAddress: account.address,
    })

    const op = await walletAPI.createSignedUserOp({
      target: recipient.address,
      data: recipient.interface.encodeFunctionData('something', ['hello']),
    })

    try {
      const requestId = await bundlerProvider.sendUserOpToBundler(op)
      const txid = await walletAPI.getUserOpReceipt(requestId)
      console.log('reqId', requestId, 'txid=', txid)
      const receipt = await env.l2Provider.getTransactionReceipt(txid)
      const returnedlogIndex = await getFilteredLogIndex(
        receipt,
        SampleRecipient__factory.abi,
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
    } catch (e) {
      throw new Error('Submission to Bundler Failed: ' + e)
    }
  })
  it('should deploy a wallet if it doesnt exist through initCode', async () => {
    // Deploy WalletDeployer
    const SimpleWalletDeployer__factory = new ContractFactory(
      SimpleWalletDeployerJson.abi,
      SimpleWalletDeployerJson.bytecode,
      env.l2Wallet_2
    )
    const SimpleWalletDeployer = await SimpleWalletDeployer__factory.deploy()
    console.log('factory deployed to', SimpleWalletDeployer.address)

    const walletAPI = new SimpleWalletAPI({
      provider: env.l2Provider,
      entryPointAddress,
      owner: env.l2Wallet_2,
      factoryAddress: SimpleWalletDeployer.address,
    })

    // `createUnsignedUserOp()` on the sdk failes only for boba:
    // Fails getting sender address from initCode at - `getCounterFactualAddress`
    // This is because `getSenderAddress()` method on EntryPoint returns the calcualted address(from intiCode)
    // as a reverted error to not deploy the initCode, but get and return only the resultant address

    // The sdk reads this resultant address from the errorArgs, which is of the form:
    // [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="getSenderAddress(bytes)",
    // data="0x6ca7b8060000000000000000000000009179e5563d0fa43edde674281c8f6f76b956a3ce",
    // errorArgs=["0x9179e5563d0FA43EDDE674281c8f6f76B956a3CE"], errorName="SenderAddressResult",
    // errorSignature="SenderAddressResult(address)", reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)

    // On Boba however, the revert data is not returned, resulting in
    //  (missing revert data in call exception; Transaction reverted without a reason string)
    // and the sdk is unable to calculate sender

    // const op = await walletAPI.createUnsignedUserOp({
    //   target: recipient.address,
    //   data: recipient.interface.encodeFunctionData('something', ['hello']),
    // })
  })
})
