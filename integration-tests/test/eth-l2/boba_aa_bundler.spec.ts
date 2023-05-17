import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import {
  Contract,
  ContractFactory,
  utils,
  constants,
  BigNumber,
  Wallet,
} from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { HDNode, hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'
// use local sdk
import { SimpleAccountAPI } from '@bobanetwork/bundler_sdk'
import SimpleAccountFactoryJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@bobanetwork/bundler_sdk/dist/HttpRpcClient'
import { resolveHexlify } from '@boba/bundler_utils'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import EntryPointWrapperJson from '@boba/accountabstraction/artifacts/contracts/bundler/EntryPointWrapper.sol/EntryPointWrapper.json'
import {
  EntryPoint,
  EntryPointWrapper,
} from "@boba/accountabstraction/types";
import {
  BundleManager,
  BundlerReputationParams,
  EventsManager,
  ExecutionManager,
  MempoolManager,
  ReputationManager,
  ValidationManager,
  UserOpMethodHandler,
  BundlerConfig,
} from '@boba/bundler'
import { ethers } from 'hardhat'

describe('AA Bundler Test\n', async () => {
  let env: OptimismEnv
  let SimpleAccountFactory__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient

  let SampleRecipient__factory: ContractFactory

  let accountFactory
  let account
  let accountAPI: SimpleAccountAPI

  let entryPoint: EntryPoint
  let entryPointWrapper: EntryPointWrapper
  let methodHandler: UserOpMethodHandler

  before(async () => {
    env = await OptimismEnv.new()
    const entryPointAddress = env.addressesAABOBA.L2_BOBA_EntryPoint

   /* entryPoint = new Contract(
      entryPointAddress,
      EntryPointJson.abi,
      env.l2Wallet
    ) as EntryPoint*/

    const EntryPoint__factory = new ContractFactory(
      EntryPointJson.abi,
      EntryPointJson.bytecode,
      env.l2Wallet
    )

    entryPoint = (await EntryPoint__factory.deploy() as EntryPoint)

    const EntryPointWrapper__factory = new ContractFactory(
      EntryPointWrapperJson.abi,
      EntryPointWrapperJson.bytecode,
      env.l2Wallet
    )

    entryPointWrapper = (await EntryPointWrapper__factory.deploy(
      entryPointAddress
    ) as EntryPointWrapper)

    SampleRecipient__factory = new ContractFactory(
      SampleRecipientJson.abi,
      SampleRecipientJson.bytecode,
      env.l2Wallet
    )

    recipient = await SampleRecipient__factory.deploy()

    bundlerProvider = new HttpRpcClient(
      env.bundlerUrl,
      entryPoint.address,
      await env.l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )

    SimpleAccountFactory__factory = new ContractFactory(
      SimpleAccountFactoryJson.abi,
      SimpleAccountFactoryJson.bytecode,
      env.l2Wallet
    )
    accountFactory = await SimpleAccountFactory__factory.deploy(
      entryPoint.address
    )
    await accountFactory.deployed()
    console.log('Account Factory deployed to:', accountFactory.address)
    await accountFactory.createAccount(env.l2Wallet.address, 0)
    account = await accountFactory.getAddress(env.l2Wallet.address, 0)

    accountAPI = new SimpleAccountAPI({
      provider: env.l2Provider,
      entryPointAddress: entryPoint.address,
      owner: env.l2Wallet,
      accountAddress: account,
    })

    const config: BundlerConfig = {
      beneficiary: await recipient.signer.getAddress(),
      entryPoint: entryPoint.address,
      gasFactor: '0.2',
      minBalance: '0',
      mnemonic: '',
      network: '',
      port: '3000',
      unsafe: true,
      conditionalRpc: false,
      autoBundleInterval: 0,
      autoBundleMempoolSize: 0,
      maxBundleGas: 5e6,
      // minstake zero, since we don't fund deployer.
      minStake: '0',
      minUnstakeDelay: 0,
      entryPointWrapper: entryPointWrapper.address,
      enableDebugMethods: true,
      l1NodeWeb3Url: '',
      addressManager: '',
    }

    const repMgr = new ReputationManager(
      BundlerReputationParams,
      parseEther(config.minStake),
      config.minUnstakeDelay
    )
    const mempoolMgr = new MempoolManager(repMgr)
    const validMgr = new ValidationManager(
      entryPoint,
      repMgr,
      config.unsafe,
      entryPointWrapper
    )
    const evMgr = new EventsManager(entryPoint, mempoolMgr, repMgr)
    const bundleMgr = new BundleManager(
      entryPoint,
      evMgr,
      mempoolMgr,
      validMgr,
      repMgr,
      config.beneficiary,
      parseEther(config.minBalance),
      config.maxBundleGas,
      false,
      false,
      entryPointWrapper
    )
    const execManager = new ExecutionManager(
      repMgr,
      mempoolMgr,
      bundleMgr,
      validMgr
    )
    methodHandler = new UserOpMethodHandler(
      execManager,
      ethers.provider,
      recipient.signer,
      config,
      entryPoint,
      entryPointWrapper
    )
  })

  describe('query rpc calls: eth_estimateUserOperationGas, eth_callUserOperation', async () => {
    it.only('estimateUserOperationGas should estimate even without eth', async () => {
      const op = await accountAPI.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
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
