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
  UserOpMethodHandler,
} from '@boba/bundler'

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

  before(async () => {
    env = await OptimismEnv.new()
    const entryPointAddress = env.addressesAABOBA.L2_BOBA_EntryPoint

    entryPoint = new Contract(
      entryPointAddress,
      EntryPointJson.abi,
      env.l2Wallet
    ) as EntryPoint

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
      entryPointAddress,
      owner: env.l2Wallet,
      accountAddress: account,
    })

  })

  describe('query rpc calls: eth_estimateUserOperationGas, eth_callUserOperation', async () => {
    it('estimateUserOperationGas should estimate even without eth', async () => {
      const op = await accountAPI.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
      })

      const ret: any = await bundlerProvider.estimateUserOpGas(op)

      expect(parseInt(ret.verificationGas, 16)).to.be.closeTo(30000, 100000)
      expect(parseInt(ret.callGasLimit, 16)).to.be.closeTo(25000, 10000)
    })
  })
})
