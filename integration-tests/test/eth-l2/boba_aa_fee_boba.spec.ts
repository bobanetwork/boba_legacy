import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, constants, BigNumber } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'
// use local sdk
import { SimpleAccountAPI } from '@boba/bundler_sdk'
import MockFeedRegistryJson from '@boba/accountabstraction/artifacts/contracts/test/mocks/MockFeedRegistry.sol/MockFeedRegistry.json'
import SimpleAccountJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleAccount.sol/SimpleAccount.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@boba/bundler_sdk/dist/HttpRpcClient'

import BobaDepositPaymasterJson from '@boba/accountabstraction/artifacts/contracts/samples/BobaDepositPaymaster.sol/BobaDepositPaymaster.json'

describe('AA Boba as Fee token Test\n', async () => {
  let env: OptimismEnv
  let SimpleAccount__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let L2BOBAToken: Contract

  let BobaDepositPaymaster__factory: ContractFactory
  let BobaDepositPaymaster: Contract

  let PriceOracle__factory: ContractFactory
  let PriceOracle: Contract

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

    L2BOBAToken = new Contract(
        env.addressesBOBA.TOKENS.BOBA.L2,
        L2GovernanceERC20Json.abi,
        env.l2Wallet
    )

    bundlerProvider = new HttpRpcClient(
      env.bundlerUrl,
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
  })
  // this paymaster allows to sponsor txs in exchange for $BOBA tokens paid to it
  // this does not use the dual fee token system
  describe('A user without ETH pays for a tx through a paymaster that accepts $BOBA', async () => {
    let accountAPI: SimpleAccountAPI
    let account
    let preApproveTokenBalance
    let preApproveDepositAmount
    let preApproveEtherBalance
    let postApproveTokenBalance
    let postApproveDepositAmount
    let postApproveEtherBalance
    let signedOp

    before('the paymaster operator sets up the paymaster by staking and adding deposits', async () => {
      await BobaDepositPaymaster.addStake(1, { value: utils.parseEther('2') })
      await EntryPoint.depositTo(BobaDepositPaymaster.address, {
        value: utils.parseEther('1')
      })
    })

    before('the user approves the paymaster to spend their $BOBA token', async () => {
      // deploy a 4337 Wallet and send operation to this wallet
      SimpleAccount__factory = new ContractFactory(
        SimpleAccountJson.abi,
        SimpleAccountJson.bytecode,
        env.l2Wallet
      )
      account = await SimpleAccount__factory.deploy(
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

      accountAPI = new SimpleAccountAPI({
        provider: env.l2Provider,
        entryPointAddress,
        owner: env.l2Wallet,
        walletAddress: account.address,
      })

      const approveOp = await accountAPI.createSignedUserOp({
          target: L2BOBAToken.address,
          data: L2BOBAToken.interface.encodeFunctionData('approve', [BobaDepositPaymaster.address, constants.MaxUint256]),
      })

      preApproveTokenBalance = await L2BOBAToken.balanceOf(account.address)
      preApproveDepositAmount = (await BobaDepositPaymaster.depositInfo(L2BOBAToken.address, account.address)).amount
      preApproveEtherBalance = await env.l2Provider.getBalance(account.address)

      const requestId = await bundlerProvider.sendUserOpToBundler(approveOp)
      const txid = await accountAPI.getUserOpReceipt(requestId)
      console.log('reqId', requestId, 'txid=', txid)

      postApproveTokenBalance = await L2BOBAToken.balanceOf(account.address)
      postApproveDepositAmount = (await BobaDepositPaymaster.depositInfo(L2BOBAToken.address, account.address)).amount
      postApproveEtherBalance = await env.l2Provider.getBalance(account.address)
    })
    it('should be able to submit a userOp including the paymaster to the bundler and trigger tx', async () => {
      const op = await accountAPI.createUnsignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
      })


      // TODO: check why paymasterAndData does not work when added to the walletAPI
      op.paymasterAndData = hexConcat([BobaDepositPaymaster.address, hexZeroPad(L2BOBAToken.address, 20)])
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
    })
  })
})
