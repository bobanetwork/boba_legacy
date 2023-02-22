import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, constants, BigNumber, Wallet } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat } from 'ethers/lib/utils'
// use local sdk
import { SimpleWalletAPI } from '@account-abstraction/sdk/src/SimpleWalletAPI'
import SimpleWalletJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleWallet.sol/SimpleWallet.json'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import { SampleRecipient__factory } from '@account-abstraction/utils/dist/src/types'
import { HttpRpcClient } from '@account-abstraction/sdk/dist/src/HttpRpcClient'

import VerifyingPaymasterJson from '@boba/accountabstraction/artifacts/contracts/samples/VerifyingPaymaster.sol/VerifyingPaymaster.json'

describe('Sponsoring Tx\n', async () => {
  let env: OptimismEnv
  let SimpleWallet__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let VerifyingPaymaster__factory: ContractFactory
  let VerifyingPaymaster: Contract

  let EntryPoint: Contract

  let offchainSigner: Wallet

  before(async () => {
    env = await OptimismEnv.new()
    entryPointAddress = env.addressesAABOBA.BOBA_EntryPoint

    recipient = await new SampleRecipient__factory(env.l2Wallet).deploy()

    bundlerProvider = new HttpRpcClient(
      'http://localhost:3000/rpc',
      entryPointAddress,
      await env.l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )

    SimpleWallet__factory = new ContractFactory(
      SimpleWalletJson.abi,
      SimpleWalletJson.bytecode,
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

    await VerifyingPaymaster.addStake(1, { value: utils.parseEther('2') })
    await EntryPoint.depositTo(VerifyingPaymaster.address, {
      value: utils.parseEther('1')
    })
  })
  it('{tag:other} should be able to send a userOperation to a wallet through the bundler', async () => {
    // deploy a 4337 Wallet and send operation to this wallet
    const account = await SimpleWallet__factory.deploy(
      entryPointAddress,
      env.l2Wallet_3.address
    )
    await account.deployed()

    const walletAPI = new SimpleWalletAPI({
      provider: env.l2Provider,
      entryPointAddress,
      owner: env.l2Wallet_3,
      walletAddress: account.address,
    })

    const op = await walletAPI.createSignedUserOp({
      target: recipient.address,
      data: recipient.interface.encodeFunctionData('something', ['hello']),
    })
    // add preverificaiton gas to account for paymaster signature
    op.preVerificationGas = BigNumber.from(await op.preVerificationGas).add(3000)

    const hash = await VerifyingPaymaster.getHash(op)
    const sig = await offchainSigner.signMessage(utils.arrayify(hash))


    op.paymasterAndData = hexConcat([VerifyingPaymaster.address, sig])

    const signedOp = await walletAPI.signUserOp(op)

    const preUserBalance = await env.l2Provider.getBalance(env.l2Wallet_3.address)
    const prePaymasterDeposit = await VerifyingPaymaster.getDeposit()

    try {
      const requestId = await bundlerProvider.sendUserOpToBundler(signedOp)
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

      const returnedEPlogIndex = await getFilteredLogIndex(
        receipt,
        EntryPointJson.abi,
        entryPointAddress,
        'UserOperationEvent'
      )
      const logEP = EntryPoint.interface.parseLog(receipt.logs[returnedEPlogIndex])
      const postUserBalance = await env.l2Provider.getBalance(env.l2Wallet_3.address)
      const postPaymasterDeposit = await VerifyingPaymaster.getDeposit()

      expect(postUserBalance).to.eq(preUserBalance)
      expect(postPaymasterDeposit).to.eq(prePaymasterDeposit.sub(logEP.args.actualGasCost))
    } catch (e) {
      console.log(e)
      throw new Error('Submission to Bundler Failed')
    }
  })
})