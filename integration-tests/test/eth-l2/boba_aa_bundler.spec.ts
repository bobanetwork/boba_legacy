import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, Signer, utils, Wallet } from 'ethers'

import { getFilteredLogIndex, l2Wallet } from './shared/utils'

import { OptimismEnv } from './shared/env'
// use local sdk
import { SimpleAccountAPI, wrapProvider } from '@bobanetwork/bundler_sdk'
import SimpleAccountFactoryJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import SenderCreatorJson from '@boba/accountabstraction/artifacts/contracts/core/SenderCreator.sol/SenderCreator.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@bobanetwork/bundler_sdk/dist/HttpRpcClient'
import { EntryPoint, EntryPointWrapper } from '@boba/accountabstraction/types'
import { resolveHexlify } from '@boba/bundler_utils'

// TODO
import { isGeth, waitFor } from '@boba/bundler/utils'
import { UserOpMethodHandler, BundlerConfig } from '@boba/bundler'

describe('AA Bundler Test\n', async () => {
  let env: OptimismEnv
  let SimpleAccount__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let SampleRecipient__factory: ContractFactory

  let methodHandler: UserOpMethodHandler

  let entryPoint: EntryPoint
  let entryPointWrapper: EntryPointWrapper

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

  describe('query rpc calls: eth_estimateUserOperationGas, eth_callUserOperation', () => {
    let smartAccountAPI: SimpleAccountAPI
    let target: string
    before('init', async () => {
      const config: BundlerConfig = {
        beneficiary: await signer.getAddress(),
        entryPoint: entryPoint.address,
        gasFactor: '0.2',
        minBalance: '0',
        mnemonic: '',
        network: '',
        port: '3000',
        unsafe: !(await isGeth(provider as any)),
        conditionalRpc: false,
        autoBundleInterval: 0,
        autoBundleMempoolSize: 0,
        maxBundleGas: 5e6,
        // minstake zero, since we don't fund deployer.
        minStake: '0',
        minUnstakeDelay: 0,
        entryPointWrapper: entryPointWrapper.address,
      }

      methodHandler = new UserOpMethodHandler(
        execManager,
        provider,
        signer,
        config,
        entryPoint,
        entryPointWrapper
      )

      const accountFactory = await SimpleAccount__factory.deploy(
        entryPointAddress,
        { gasLimit: 9_500_000 }
      )
      await accountFactory.deployed()
      console.log('Account Factory deployed to:', accountFactory.address)
      await accountFactory.createAccount(env.l2Wallet.address, 0)
      const account = await accountFactory.getAddress(env.l2Wallet.address, 0)
      console.log('Account deployed to:', account)
      const SenderCreator__factory = new ContractFactory(
        SenderCreatorJson.abi,
        SenderCreatorJson.bytecode,
        env.l2Wallet
      )
      const senderCreator = await SenderCreator__factory.deploy({
        gasLimit: 9_500_000,
      })

      console.log('Sender Creator Factory deployed to:', senderCreator.address)

      smartAccountAPI = new SimpleAccountAPI({
        provider: env.l2Provider,
        entryPointAddress,
        senderCreatorAddress: senderCreator.address,
        owner: env.l2Wallet,
        factoryAddress: accountFactory.address,
        accountAddress: account,
      })
    })
    it('estimateUserOperationGas should estimate even without eth', async () => {
      const op = await smartAccountAPI.createSignedUserOp({
        target,
        data: '0xdeadface',
      })
      const ret = await methodHandler.estimateUserOperationGas(
        await resolveHexlify(op),
        entryPoint.address
      )
      // verification gas should be high - it creates this wallet
      expect(ret.verificationGas).to.be.closeTo(300000, 100000)
      // execution should be quite low.
      // (NOTE: actual execution should revert: it only succeeds because the wallet is NOT deployed yet,
      // and estimation doesn't perform full deploy-validate-execute cycle)
      expect(ret.callGasLimit).to.be.closeTo(25000, 10000)
    })
  })
})
