import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, constants, BigNumber } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'
import { predeploys } from '@eth-optimism/contracts'
// use local sdk
import { SimpleAccountAPI } from '@bobanetwork/bundler_sdk'
import SimpleAccountJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccount.sol/SimpleAccount.json'
import SimpleAccountFactoryJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import L2StandardERC20Json from '@eth-optimism/contracts/artifacts/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@bobanetwork/bundler_sdk/dist/HttpRpcClient'

import GPODepositPaymasterJson from '@boba/accountabstraction/artifacts/contracts/samples/GPODepositPaymaster.sol/GPODepositPaymaster.json'

describe('AA Alt-L1 Alt Token as Paymaster Fee Test\n', async () => {
  let env: OptimismEnv
  let SimpleAccountFactory__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let L2_L1NativeToken: Contract

  let GPODepositPaymaster__factory: ContractFactory
  let GPODepositPaymaster: Contract

  let SampleRecipient__factory: ContractFactory

  let EntryPoint: Contract

  before(async () => {
    env = await OptimismEnv.new()
    entryPointAddress = env.addressesAABOBA.L2_BOBA_EntryPoint

    SampleRecipient__factory = new ContractFactory(
      SampleRecipientJson.abi,
      SampleRecipientJson.bytecode,
      env.l2Wallet
    )

    recipient = await SampleRecipient__factory.deploy()

    L2_L1NativeToken = new Contract(
      predeploys.L2_L1NativeToken_ALT_L1,
      L2StandardERC20Json.abi,
      env.l2Wallet
    )

    bundlerProvider = new HttpRpcClient(
      env.bundlerUrl,
      entryPointAddress,
      await env.l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )

    GPODepositPaymaster__factory = new ContractFactory(
      GPODepositPaymasterJson.abi,
      GPODepositPaymasterJson.bytecode,
      env.l2Wallet
    )

    GPODepositPaymaster = await GPODepositPaymaster__factory.deploy(
      entryPointAddress,
      L2_L1NativeToken.address,
      await L2_L1NativeToken.decimals(),
      predeploys.Proxy__Boba_GasPriceOracle
    )

    EntryPoint = new Contract(
      entryPointAddress,
      EntryPointJson.abi,
      env.l2Wallet
    )
  })
  describe('A user without native token pays for a tx using an alt token through a paymaster', async () => {
    let accountAPI: SimpleAccountAPI
    let account
    let accountFactory
    let preApproveTokenBalance
    let preApproveDepositAmount
    let preApproveEtherBalance
    let postApproveTokenBalance
    let postApproveDepositAmount
    let postApproveEtherBalance
    let signedOp

    before(
      'the paymaster operator sets up the paymaster by staking and adding deposits',
      async () => {
        await GPODepositPaymaster.addStake(1, { value: utils.parseEther('2') })
        await EntryPoint.depositTo(GPODepositPaymaster.address, {
          value: utils.parseEther('1'),
        })
      }
    )

    before(
      'the user approves the paymaster to spend their $BOBA token',
      async () => {
        // deploy a 4337 Wallet and send operation to this wallet
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
        console.log('Account deployed to:', account)

        await L2_L1NativeToken.transfer(account, utils.parseEther('1'))

        await L2_L1NativeToken.approve(
          GPODepositPaymaster.address,
          constants.MaxUint256
        )
        await GPODepositPaymaster.addDepositFor(account, utils.parseEther('2'))

        await env.l2Wallet.sendTransaction({
          value: utils.parseEther('2'),
          to: account,
        })

        accountAPI = new SimpleAccountAPI({
          provider: env.l2Provider,
          entryPointAddress,
          owner: env.l2Wallet,
          accountAddress: account,
        })

        const approveOp = await accountAPI.createSignedUserOp({
          target: L2_L1NativeToken.address,
          data: L2_L1NativeToken.interface.encodeFunctionData('approve', [
            GPODepositPaymaster.address,
            constants.MaxUint256,
          ]),
        })

        preApproveTokenBalance = await L2_L1NativeToken.balanceOf(account)
        preApproveDepositAmount = (
          await GPODepositPaymaster.depositInfo(account)
        ).amount
        preApproveEtherBalance = await env.l2Provider.getBalance(account)

        const requestId = await bundlerProvider.sendUserOpToBundler(approveOp)
        const txid = await accountAPI.getUserOpReceipt(requestId)
        console.log('reqId', requestId, 'txid=', txid)

        postApproveTokenBalance = await L2_L1NativeToken.balanceOf(account)
        postApproveDepositAmount = (
          await GPODepositPaymaster.depositInfo(account)
        ).amount
        postApproveEtherBalance = await env.l2Provider.getBalance(account)
      }
    )

    it('should be able to submit a userOp including the paymaster to the bundler and trigger tx', async () => {
      const op = await accountAPI.createUnsignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
      })

      op.paymasterAndData = GPODepositPaymaster.address
      op.preVerificationGas = await accountAPI.getPreVerificationGas(op)

      signedOp = await accountAPI.signUserOp(op)

      const requestId = await bundlerProvider.sendUserOpToBundler(signedOp)
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
      const postCallTokenBalance = await L2_L1NativeToken.balanceOf(account)
      const postCallDepositAmount = (
        await GPODepositPaymaster.depositInfo(account)
      ).amount
      const postCallEtherBalance = await env.l2Provider.getBalance(account)

      const returnedEPlogIndex = await getFilteredLogIndex(
        receipt,
        EntryPointJson.abi,
        entryPointAddress,
        'UserOperationEvent'
      )
      const logEP = EntryPoint.interface.parseLog(
        receipt.logs[returnedEPlogIndex]
      )

      // no token is used when approving, ether balance is used to pay approval fees
      expect(preApproveTokenBalance).to.eq(postApproveTokenBalance)
      expect(preApproveEtherBalance).to.gt(postApproveEtherBalance)
      // users deposit amount on paymaster remains constant and is unused throughout
      expect(preApproveDepositAmount).to.eq(postApproveDepositAmount)
      expect(postApproveDepositAmount).to.eq(postCallDepositAmount)
      // no ether is used when calling the recipient with the help of the paymaster, users boba token is used to pay
      expect(postApproveEtherBalance).to.eq(postCallEtherBalance)
      expect(postApproveTokenBalance).to.gt(postCallTokenBalance)
      // account for l1 submission cost too
      expect(
        BigNumber.from(postCallTokenBalance).add(logEP.args.actualGasCost)
      ).to.closeTo(
        BigNumber.from(postApproveTokenBalance),
        utils.parseEther('0.3')
      )
    })
  })
})
