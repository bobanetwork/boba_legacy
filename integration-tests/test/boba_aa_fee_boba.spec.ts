import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, constants, BigNumber } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'
// use local sdk
import { SimpleWalletAPI } from '@account-abstraction/sdk/src/SimpleWalletAPI'
import SimpleWalletDeployerJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleWalletDeployer.sol/SimpleWalletDeployer.json'
import MockFeedRegistryJson from '@boba/accountabstraction/artifacts/contracts/test/mocks/MockFeedRegistry.sol/MockFeedRegistry.json'
import FeedRegistryJson from '@boba/contracts/artifacts/contracts/oracle/FeedRegistry.sol/FeedRegistry.json'
import SimpleWalletJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleWallet.sol/SimpleWallet.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import { SampleRecipient, SampleRecipient__factory } from '@account-abstraction/utils/dist/src/types'
import { HttpRpcClient } from '@account-abstraction/sdk/dist/src/HttpRpcClient'

import BobaDepositPaymasterJson from '@boba/accountabstraction/artifacts/contracts/samples/BobaDepositPaymaster.sol/BobaDepositPaymaster.json'

describe('AA Boba as Fee token Test\n', async () => {
  let env: OptimismEnv
  let SimpleWallet__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let L2BOBAToken: Contract

  let BobaDepositPaymaster__factory: ContractFactory
  let BobaDepositPaymaster: Contract

  let PriceOracle__factory: ContractFactory
  let PriceOracle: Contract

  let EntryPoint: Contract

  before(async () => {
    env = await OptimismEnv.new()
    entryPointAddress = env.addressesAABOBA.BOBA_EntryPoint

    recipient = await new SampleRecipient__factory(env.l2Wallet).deploy()

    L2BOBAToken = new Contract(
        env.addressesBOBA.TOKENS.BOBA.L2,
        L2GovernanceERC20Json.abi,
        env.l2Wallet
    )

    bundlerProvider = new HttpRpcClient(
      'http://localhost:3000/rpc',
      entryPointAddress,
      await env.l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )

    BobaDepositPaymaster__factory = new ContractFactory(
      BobaDepositPaymasterJson.abi,
      BobaDepositPaymasterJson.bytecode,
      env.l2Wallet
    )

    PriceOracle__factory = new ContractFactory(
      MockFeedRegistryJson.abi,
      MockFeedRegistryJson.bytecode,
      env.l2Wallet
    )

    PriceOracle = await PriceOracle__factory.deploy()

    BobaDepositPaymaster = await BobaDepositPaymaster__factory.deploy(
      entryPointAddress,
      // ethPrice oracle
      PriceOracle.address
    )

    // add boba token
    await BobaDepositPaymaster.addToken(
        L2BOBAToken.address,
        // tokenPrice oracle
        PriceOracle.address,
        L2BOBAToken.address,
        18
    )

    EntryPoint = new Contract(
      entryPointAddress,
      EntryPointJson.abi,
      env.l2Wallet
    )

    await BobaDepositPaymaster.addStake(1, { value: utils.parseEther('2') })
    await EntryPoint.depositTo(BobaDepositPaymaster.address, {
      value: utils.parseEther('1')
    })
  })
  it('should be able to send a userOperation to a wallet through the bundler', async () => {
    // deploy a 4337 Wallet and send operation to this wallet
    SimpleWallet__factory = new ContractFactory(
      SimpleWalletJson.abi,
      SimpleWalletJson.bytecode,
      env.l2Wallet
    )
    const account = await SimpleWallet__factory.deploy(
      entryPointAddress,
      env.l2Wallet.address
    )
    await account.deployed()

    await L2BOBAToken.transfer(account.address, utils.parseEther('1'))

    await L2BOBAToken.approve(BobaDepositPaymaster.address, constants.MaxUint256)
    await BobaDepositPaymaster.addDepositFor(L2BOBAToken.address, account.address, utils.parseEther('2'))

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

    const approveOp = await walletAPI.createSignedUserOp({
        target: L2BOBAToken.address,
        data: L2BOBAToken.interface.encodeFunctionData('approve', [BobaDepositPaymaster.address, constants.MaxUint256]),
    })

    const preApproveTokenBalance = await L2BOBAToken.balanceOf(account.address)
    const preApproveDepositAmount = (await BobaDepositPaymaster.depositInfo(L2BOBAToken.address, account.address)).amount
    const preApproveEtherBalance = await env.l2Provider.getBalance(account.address)

    try {
        const requestId = await bundlerProvider.sendUserOpToBundler(approveOp)
        const txid = await walletAPI.getUserOpReceipt(requestId)
        console.log('reqId', requestId, 'txid=', txid)
    } catch (e) {
        throw new Error('Submission to Bundler Failed: ' + e)
    }

    const postApproveTokenBalance = await L2BOBAToken.balanceOf(account.address)
    const postApproveDepositAmount = (await BobaDepositPaymaster.depositInfo(L2BOBAToken.address, account.address)).amount
    const postApproveEtherBalance = await env.l2Provider.getBalance(account.address)
    const op = await walletAPI.createUnsignedUserOp({
      target: recipient.address,
      data: recipient.interface.encodeFunctionData('something', ['hello']),
    })


    op.paymasterAndData = hexConcat([BobaDepositPaymaster.address, hexZeroPad(L2BOBAToken.address, 20)])
    op.preVerificationGas = await walletAPI.getPreVerificationGas(op)

    const signedOp = await walletAPI.signUserOp(op)

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
      const postCallTokenBalance = await L2BOBAToken.balanceOf(account.address)
      const postCallDepositAmount = (await BobaDepositPaymaster.depositInfo(L2BOBAToken.address, account.address)).amount
      const postCallEtherBalance = await env.l2Provider.getBalance(account.address)

      const returnedEPlogIndex = await getFilteredLogIndex(
        receipt,
        EntryPointJson.abi,
        entryPointAddress,
        'UserOperationEvent'
      )
      const logEP = EntryPoint.interface.parseLog(receipt.logs[returnedEPlogIndex])

      // no token is used when approving, ether balance is used to pay approval fees
      expect(preApproveTokenBalance).to.eq(postApproveTokenBalance)
      expect(preApproveEtherBalance).to.gt(postApproveEtherBalance)
      // users deposit amount on paymaster remains constant and is unused throughout
      expect(preApproveDepositAmount).to.eq(postApproveDepositAmount)
      expect(postApproveDepositAmount).to.eq(postCallDepositAmount)
      // no ether is used when calling the recipient with the help of the paymaster, users boba token is used to pay
      expect(postApproveEtherBalance).to.eq(postCallEtherBalance)
      expect(postApproveTokenBalance).to.gt(postCallTokenBalance)
      expect(BigNumber.from(postCallTokenBalance).add(logEP.args.actualGasCost)).to.closeTo(BigNumber.from(postApproveTokenBalance), utils.parseEther('0.0001'))
    } catch (e) {
      throw new Error('Submission to Bundler Failed: ' + e)
    }
  })
})