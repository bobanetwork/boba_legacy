import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, utils, constants, BigNumber } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import { OptimismEnv } from './shared/env'
import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils'
// use local sdk
import { SimpleWalletAPI } from '@account-abstraction/sdk'
import SimpleWalletDeployerJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleWalletDeployer.sol/SimpleWalletDeployer.json'
import MockFeedRegistryJson from '@boba/accountabstraction/artifacts/contracts/test/mocks/MockFeedRegistry.sol/MockFeedRegistry.json'
import FeedRegistryJson from '@boba/contracts/artifacts/contracts/oracle/FeedRegistry.sol/FeedRegistry.json'
import SimpleWalletJson from '@boba/accountabstraction/artifacts/contracts/samples/SimpleWallet.sol/SimpleWallet.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import L2StandardERC20Json from '@eth-optimism/contracts/artifacts/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json'
import EntryPointJson from '@boba/accountabstraction/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import { SampleRecipient, SampleRecipient__factory } from '@account-abstraction/utils/dist/src/types'
import { HttpRpcClient } from '@account-abstraction/sdk/dist/src/HttpRpcClient'

import ManualDepositPaymasterJson from '@boba/accountabstraction/artifacts/contracts/samples/ManualDepositPaymaster.sol/ManualDepositPaymaster.json'

describe('AA Alt Fee Token Test\n', async () => {
  let env: OptimismEnv
  let SimpleWallet__factory: ContractFactory
  let recipient: Contract

  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let L2ERC20Token__factory: ContractFactory
  let L2ERC20Token: Contract

  let ManualDepositPaymaster__factory: ContractFactory
  let ManualDepositPaymaster: Contract

  let EntryPoint

  before(async () => {
    env = await OptimismEnv.new()
    entryPointAddress = env.addressesAABOBA.BOBA_EntryPoint

    recipient = await new SampleRecipient__factory(env.l2Wallet).deploy()

    L2ERC20Token__factory = new ContractFactory(
        L2StandardERC20Json.abi,
        L2StandardERC20Json.bytecode,
        env.l2Wallet
    )

    // set bridge as wallet_2 to easily mint
    L2ERC20Token = await L2ERC20Token__factory.deploy(env.l2Wallet_2.address, env.l2Wallet_2.address, 'PEARL', 'PEARL', 18)
    // mint tokens to wallet
    console.log(L2ERC20Token.address)
    await L2ERC20Token.connect(env.l2Wallet_2).mint(env.l2Wallet.address, utils.parseEther('500'))

    bundlerProvider = new HttpRpcClient(
      'http://localhost:3000/rpc',
      entryPointAddress,
      await env.l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )
  })
  it('{tag:other} should be able to send a userOperation to a wallet through the bundler', async () => {
    ManualDepositPaymaster__factory = new ContractFactory(
        ManualDepositPaymasterJson.abi,
        ManualDepositPaymasterJson.bytecode,
        env.l2Wallet
      )

      const OracleContract__factory = new ContractFactory(
        MockFeedRegistryJson.abi,
        MockFeedRegistryJson.bytecode,
        env.l2Wallet
      )

      ManualDepositPaymaster = await ManualDepositPaymaster__factory.deploy(
        entryPointAddress,
      )

    const priceRatio = 100
    const priceRatioDecimals = 2
    const minRatio = 1
    const maxRatio = 500

    // add alt erc20 token
    await ManualDepositPaymaster.addToken(
        L2ERC20Token.address,
        // token decimals
        await L2ERC20Token.decimals(),
        priceRatio,
        priceRatioDecimals,
        minRatio,
        maxRatio
    )

    EntryPoint = new Contract(
      entryPointAddress,
      EntryPointJson.abi,
      env.l2Wallet
    )

    await ManualDepositPaymaster.addStake(1, { value: utils.parseEther('2') })
    await EntryPoint.depositTo(ManualDepositPaymaster.address, {
      value: utils.parseEther('1')
    })
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

    await L2ERC20Token.transfer(account.address, utils.parseEther('1'))

    await L2ERC20Token.approve(ManualDepositPaymaster.address, constants.MaxUint256)
    await ManualDepositPaymaster.addDepositFor(L2ERC20Token.address, account.address, utils.parseEther('2'))

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
        target: L2ERC20Token.address,
        data: L2ERC20Token.interface.encodeFunctionData('approve', [ManualDepositPaymaster.address, constants.MaxUint256]),
        maxFeePerGas: '0x59682F00',
        maxPriorityFeePerGas: '0x59682F00',
    })

    const preApproveTokenBalance = await L2ERC20Token.balanceOf(account.address)
    const preApproveDepositAmount = (await ManualDepositPaymaster.depositInfo(L2ERC20Token.address, account.address)).amount
    const preApproveEtherBalance = await env.l2Provider.getBalance(account.address)

    try {
        const requestId = await bundlerProvider.sendUserOpToBundler(approveOp)
        const txid = await walletAPI.getUserOpReceipt(requestId)
        console.log('reqId', requestId, 'txid=', txid)
    } catch (e) {
        console.log(e)
        throw new Error('Submission to Bundler Failed')
    }

    const postApproveTokenBalance = await L2ERC20Token.balanceOf(account.address)
    const postApproveDepositAmount = (await ManualDepositPaymaster.depositInfo(L2ERC20Token.address, account.address)).amount
    const postApproveEtherBalance = await env.l2Provider.getBalance(account.address)
    const op = await walletAPI.createUnsignedUserOp({
      target: recipient.address,
      data: recipient.interface.encodeFunctionData('something', ['hello']),
      maxFeePerGas: '0x59682F00',
      maxPriorityFeePerGas: '0x59682F00',
    })


    op.paymasterAndData = hexConcat([ManualDepositPaymaster.address, hexZeroPad(L2ERC20Token.address, 20)])
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
      // tx.origin is the owner of the wallet
      expect(log.args.txOrigin).to.eq(env.l2Wallet.address)
      // msg.sender is the 4337 wallet
      expect(log.args.msgSender).to.eq(account.address)
      // message is received and emitted
      expect(log.args.message).to.eq('hello')
      const postCallTokenBalance = await L2ERC20Token.balanceOf(account.address)
      const postCallDepositAmount = (await ManualDepositPaymaster.depositInfo(L2ERC20Token.address, account.address)).amount
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
    } catch (e) {
      console.log(e)
      throw new Error('Submission to Bundler Failed')
    }
  })
})