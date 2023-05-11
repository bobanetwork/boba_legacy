import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, constants, BigNumber } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'
// use local sdk
import { SimpleAccountAPI } from '@bobanetwork/bundler_sdk'
import SimpleAccountFactoryJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@bobanetwork/bundler_sdk/dist/HttpRpcClient'
import { resolveHexlify } from '@boba/bundler_utils'
import { UserOpMethodHandler } from "@boba/bundler";

describe('AA Bundler Test\n', async () => {
  let env: OptimismEnv
  let SimpleAccountFactory__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let SampleRecipient__factory: ContractFactory

  let accountFactory
  let account
  let accountAPI: SimpleAccountAPI

  let EntryPoint: Contract
  let methodHandler: UserOpMethodHandler

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

    EntryPoint = new Contract(
      entryPointAddress,
      EntryPointJson.abi,
      env.l2Wallet
    )

    SimpleAccountFactory__factory = new ContractFactory(
      SimpleAccountFactoryJson.abi,
      SimpleAccountFactoryJson.bytecode,
      env.l2Wallet
    )
    accountFactory = await SimpleAccountFactory__factory.deploy(
      entryPointAddress
    )
    await accountFactory.deployed()
    console.log('Account Factory deployed to:', accountFactory.address)
    await accountFactory.createAccount(env.l2Wallet.address, 0)
    account = await accountFactory.getAddress(env.l2Wallet.address, 0)

    accountAPI = new SimpleAccountAPI({
      provider: env.l2Provider,
      entryPointAddress,
      owner: env.l2Wallet,
      accountAddress: account,
    })
  })
  describe('query rpc calls: eth_estimateUserOperationGas, eth_callUserOperation', async () => {
    it('estimateUserOperationGas should estimate even without eth', async () => {
      const op = await accountAPI.createSignedUserOp({
        target: recipient.address,
        data: '0xdeadface',
      })
      const ret = await methodHandler.estimateUserOperationGas(
        await resolveHexlify(op),
        entryPointAddress
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
