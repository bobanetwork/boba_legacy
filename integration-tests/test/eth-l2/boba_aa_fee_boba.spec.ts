import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, constants, BigNumber } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'
// use local sdk
import { PaymasterAPI, SimpleAccountAPI } from '@bobanetwork/bundler_sdk'
import SimpleAccountFactoryJson from '@bobanetwork/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import MockFeedRegistryJson from '@bobanetwork/accountabstraction/artifacts/contracts/test/mocks/MockFeedRegistry.sol/MockFeedRegistry.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import EntryPointJson from '@bobanetwork/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import SampleRecipientJson from '../../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import { HttpRpcClient } from '@bobanetwork/bundler_sdk/dist/HttpRpcClient'

import BobaDepositPaymasterJson from '@bobanetwork/accountabstraction/artifacts/contracts/samples/BobaDepositPaymaster.sol/BobaDepositPaymaster.json'

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
    entryPointAddress = env.addressesAABOBA.L2_Boba_EntryPoint

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
    let accountFactory
    let preApproveTokenBalance
    let preApproveDepositAmount
    let preApproveEtherBalance
    let postApproveTokenBalance
    let postApproveDepositAmount
    let postApproveEtherBalance
    let signedOp
    let tokenDifference

    before(
      'the paymaster operator sets up the paymaster by staking and adding deposits',
      async () => {
        await BobaDepositPaymaster.addStake(1, { value: utils.parseEther('2') })
        await EntryPoint.depositTo(BobaDepositPaymaster.address, {
          value: utils.parseEther('1'),
        })
      }
    )

    before(
      'the user approves the paymaster to spend their $BOBA token',
      async () => {
        // deploy a 4337 Wallet and send operation to this wallet
        SimpleAccount__factory = new ContractFactory(
          SimpleAccountFactoryJson.abi,
          SimpleAccountFactoryJson.bytecode,
          env.l2Wallet
        )
        accountFactory = await SimpleAccount__factory.deploy(entryPointAddress)
        await accountFactory.deployed()
        console.log('Account Factory deployed to:', accountFactory.address)
        await accountFactory.createAccount(env.l2Wallet.address, 0)
        account = await accountFactory.getAddress(env.l2Wallet.address, 0)
        console.log('Account deployed to:', account)

        await L2BOBAToken.transfer(account, utils.parseEther('1'))

        await L2BOBAToken.approve(
          BobaDepositPaymaster.address,
          constants.MaxUint256
        )
        await BobaDepositPaymaster.addDepositFor(
          L2BOBAToken.address,
          account,
          utils.parseEther('2')
        )

        //the account approves the paymaster to use its tokens (in order for the paymaster to deduct fees from the account)
        // this approve operation needs gas (in eth) because this step does not involve a paymaster
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
          target: L2BOBAToken.address,
          data: L2BOBAToken.interface.encodeFunctionData('approve', [
            BobaDepositPaymaster.address,
            constants.MaxUint256,
          ]),
        })

        preApproveTokenBalance = await L2BOBAToken.balanceOf(account)
        preApproveDepositAmount = (
          await BobaDepositPaymaster.depositInfo(L2BOBAToken.address, account)
        ).amount
        preApproveEtherBalance = await env.l2Provider.getBalance(account)

        const requestId = await bundlerProvider.sendUserOpToBundler(approveOp)
        const txid = await accountAPI.getUserOpReceipt(requestId)
        console.log('reqId', requestId, 'txid=', txid)

        postApproveTokenBalance = await L2BOBAToken.balanceOf(account)
        postApproveDepositAmount = (
          await BobaDepositPaymaster.depositInfo(L2BOBAToken.address, account)
        ).amount
        postApproveEtherBalance = await env.l2Provider.getBalance(account)
      }
    )
    it('should be able to submit a userOp including the paymaster to the bundler and trigger tx', async () => {
      accountAPI.paymasterAPI = new PaymasterAPI({
        paymasterAndData: hexConcat([
         BobaDepositPaymaster.address,
          hexZeroPad(L2BOBAToken.address, 20),
        ])
      })

      signedOp = await accountAPI.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello']),
      })

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
      const postCallTokenBalance = await L2BOBAToken.balanceOf(account)
      tokenDifference = postApproveTokenBalance.sub(postCallTokenBalance)
      const postCallDepositAmount = (
        await BobaDepositPaymaster.depositInfo(L2BOBAToken.address, account)
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
      expect(
        BigNumber.from(postCallTokenBalance).add(logEP.args.actualGasCost)
      ).to.closeTo(
        BigNumber.from(postApproveTokenBalance),
        utils.parseEther('0.0001')
      )
    })
    it('should not allow a non-owner to withdraw paymaster tokens', async () => {
      const ownerDeposits = await BobaDepositPaymaster.balances(L2BOBAToken.address, env.l2Wallet.address)
      expect (ownerDeposits).to.be.eq(tokenDifference)

      await expect(
        BobaDepositPaymaster.connect(env.l2Wallet_2).withdrawTokensTo(L2BOBAToken.address, env.l2Wallet_2.address, ownerDeposits)
      ).to.be.reverted
    })
    it('should allow the paymaster owner to withdraw paymaster tokens', async () => {
      const ownerDeposits = await BobaDepositPaymaster.balances(L2BOBAToken.address, env.l2Wallet.address)
      expect(ownerDeposits).to.be.eq(tokenDifference)

      const preTokenBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)
      await BobaDepositPaymaster.connect(env.l2Wallet).withdrawTokensTo(L2BOBAToken.address, env.l2Wallet.address, ownerDeposits)
      const postTokenBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

      expect(postTokenBalance).to.be.eq(preTokenBalance.add(ownerDeposits))
      const currentOwnerDeposits = await BobaDepositPaymaster.balances(L2BOBAToken.address, env.l2Wallet.address)
      expect(currentOwnerDeposits).to.be.eq(0)
    })
  })
})
