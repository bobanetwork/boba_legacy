
import 'source-map-support/register'
import { BaseProvider, JsonRpcSigner } from '@ethersproject/providers'
import { assert, expect } from 'chai'
import { ethers } from 'hardhat'
import { parseEther } from 'ethers/lib/utils'

import { getContractFactory } from '@eth-optimism/contracts'
import { UserOpMethodHandler } from '../src/UserOpMethodHandler'

import { BundlerConfig } from '../src/BundlerConfig'
import {
  EntryPoint,
  SimpleAccountDeployer__factory,
  UserOperationStruct
} from '@boba/accountabstraction'

import { DeterministicDeployer } from '@boba/bundler_sdk/src/DeterministicDeployer'
import { Wallet } from 'ethers'
import { SimpleAccountAPI } from '@boba/bundler_sdk'
import { postExecutionDump } from '@boba/bundler_utils/dist/src/postExecCheck'
import { BundlerHelper, SampleRecipient } from '../src/types'

describe('UserOpMethodHandler', function () {
  const helloWorld = 'hello world'

  let methodHandler: UserOpMethodHandler
  let provider: BaseProvider
  let signer: JsonRpcSigner
  const walletSigner = Wallet.createRandom()

  let entryPoint: EntryPoint
  let bundleHelper: BundlerHelper
  let sampleRecipient: SampleRecipient

  before(async function () {
    provider = ethers.provider
    signer = ethers.provider.getSigner()

    const addressManagerFactory = await getContractFactory('Lib_AddressManager', signer)
    const addressManager = await addressManagerFactory.deploy()
    const EntryPointFactory = await ethers.getContractFactory('EntryPoint')
    entryPoint = await EntryPointFactory.deploy()

    const bundleHelperFactory = await ethers.getContractFactory('BundlerHelper')
    bundleHelper = await bundleHelperFactory.deploy()
    console.log('bundler from=', await bundleHelper.signer.getAddress())
    const sampleRecipientFactory = await ethers.getContractFactory('SampleRecipient')
    sampleRecipient = await sampleRecipientFactory.deploy()

    const config: BundlerConfig = {
      beneficiary: await signer.getAddress(),
      entryPoint: entryPoint.address,
      gasFactor: '0.2',
      helper: bundleHelper.address,
      minBalance: '0',
      mnemonic: '',
      network: '',
      port: '3000',
      addressManager: addressManager.address,
      l1NodeWeb3Url: ''
    }

    methodHandler = new UserOpMethodHandler(
      provider,
      signer,
      config,
      entryPoint
    )
  })

  describe('eth_supportedEntryPoints', function () {
    it('eth_supportedEntryPoints', async () => {
      await expect(await methodHandler.getSupportedEntryPoints()).to.eql([entryPoint.address])
    })
  })

  describe('sendUserOperation', function () {
    let userOperation: UserOperationStruct
    let walletAddress: string

    let walletDeployerAddress: string
    before(async function () {
      DeterministicDeployer.init(ethers.provider)
      walletDeployerAddress = await DeterministicDeployer.deploy(SimpleAccountDeployer__factory.bytecode)

      const smartWalletAPI = new SimpleAccountAPI({
        provider,
        entryPointAddress: entryPoint.address,
        owner: walletSigner,
        factoryAddress: walletDeployerAddress
      })
      walletAddress = await smartWalletAPI.getWalletAddress()
      await signer.sendTransaction({
        to: walletAddress,
        value: parseEther('1')
      })

      userOperation = await smartWalletAPI.createSignedUserOp({
        data: sampleRecipient.interface.encodeFunctionData('something', [helloWorld]),
        target: sampleRecipient.address
      })
    })

    it('should send UserOperation transaction to BundlerHelper', async function () {
      const userOpHash = await methodHandler.sendUserOperation(userOperation, entryPoint.address)
      const req = await entryPoint.queryFilter(entryPoint.filters.UserOperationEvent(userOpHash))
      const transactionReceipt = await req[0].getTransactionReceipt()

      assert.isNotNull(transactionReceipt)
      const depositedEvent = entryPoint.interface.parseLog(transactionReceipt.logs[0])
      const senderEvent = sampleRecipient.interface.parseLog(transactionReceipt.logs[1])
      const userOperationEvent = entryPoint.interface.parseLog(transactionReceipt.logs[2])
      assert.equal(userOperationEvent.name, 'UserOperationEvent')
      assert.equal(userOperationEvent.args.success, true)

      assert.equal(senderEvent.name, 'Sender')
      const expectedTxOrigin = await methodHandler.signer.getAddress()
      assert.equal(senderEvent.args.txOrigin, expectedTxOrigin, 'sample origin should be bundler')
      assert.equal(senderEvent.args.msgSender, walletAddress, 'sample msgsender should be wallet')

      assert.equal(depositedEvent.name, 'Deposited')
    })

    it('should expose FailedOp errors as text messages', async () => {
      const smartWalletAPI = new SimpleAccountAPI({
        provider,
        entryPointAddress: entryPoint.address,
        owner: walletSigner,
        factoryAddress: walletDeployerAddress,
        index: 1
      })
      const op = await smartWalletAPI.createSignedUserOp({
        data: sampleRecipient.interface.encodeFunctionData('something', [helloWorld]),
        target: sampleRecipient.address
      })

      try {
        await methodHandler.sendUserOperation(op, entryPoint.address)
        throw Error('expected fail')
      } catch (e: any) {
        expect(e.message).to.match(/account didn't pay prefund/)
      }
    })

    describe('validate get paid enough', function () {
      it('should pay just enough', async () => {
        const api = new SimpleAccountAPI({
          provider,
          entryPointAddress: entryPoint.address,
          walletAddress,
          owner: walletSigner
        })
        const op = await api.createSignedUserOp({
          data: sampleRecipient.interface.encodeFunctionData('something', [helloWorld]),
          target: sampleRecipient.address,
          gasLimit: 1e6
        })
        const id = await methodHandler.sendUserOperation(op, entryPoint.address)

        // {
        //   console.log('wrong method')
        //   await methodHandler.sendUserOperation(await api.createSignedUserOp({
        //     data: sampleRecipient.interface.encodeFunctionData('something', [helloWorld + helloWorld + helloWorld + helloWorld + helloWorld]).padEnd(2000, '1'),
        //     target: walletAddress,
        //     gasLimit: 1e6
        //
        //   }), entryPoint.address)
        // }
        //
        // {
        //   console.log('self nonce')
        //   const data = keccak256(Buffer.from('nonce()')).slice(0, 10)
        //   await methodHandler.sendUserOperation(await api.createSignedUserOp({
        //     data: data,
        //     target: walletAddress,
        //     gasLimit: 1e6
        //
        //   }), entryPoint.address)
        // }

        await postExecutionDump(entryPoint, id)
      })
      it('should reject if doesn\'t pay enough', async () => {
        const api = new SimpleAccountAPI({
          provider,
          entryPointAddress: entryPoint.address,
          walletAddress,
          owner: walletSigner,
          overheads: { perUserOp: 0 }
        })
        const op = await api.createSignedUserOp({
          data: sampleRecipient.interface.encodeFunctionData('something', [helloWorld]),
          target: sampleRecipient.address
        })
        try {
          await methodHandler.sendUserOperation(op, entryPoint.address)
          throw new Error('expected to revert')
        } catch (e: any) {
          expect(e.message).to.match(/preVerificationGas too low/)
        }
      })
    })
  })
})
