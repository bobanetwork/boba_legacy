import { Contract, ContractFactory, providers, utils, Wallet } from 'ethers'
import hre from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import * as request from 'request-promise-native'

// hide wrong console log statements from utils.ts
const backConsole = console.log;
console.log = (msg: string) => null;
import { getFilteredLogIndex } from "@eth-optimism/integration-tests/test/alt-l2/shared/utils";
console.log = backConsole
import { SimpleAccountAPI, wrapProvider, HttpRpcClient } from '@bobanetwork/bundler_sdk'
import SimpleAccountFactoryJson from '@bobanetwork/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import EntryPointWrapperJson from '@bobanetwork/accountabstraction/artifacts/contracts/bundler/EntryPointWrapper.sol/EntryPointWrapper.json'
import SampleRecipientJson from '../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'
import BNB_AAAddresses from '@bobanetwork/accountabstraction/deployments/boba_bnb_testnet/addresses.json'

chai.use(solidity)

const cfg = hre.network.config
const hPort = 1235 // Port for local HTTP server

const gasLimit = 8_000_000
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const l2PK = hre.network.config.accounts[0]
const l2Wallet = new Wallet(l2PK, local_provider)
const l2PK_2 = hre.network.config.accounts[1]
const l2Wallet_2 = new Wallet(l2PK_2, local_provider)

const useExistingRecipient = true // save gas when debugging
const recipientAddress = '0x78489aC02B2e683e3B7763Ba25AD02d2815f6651'

describe('General AA example', () => {

  let SimpleAccount__factory: ContractFactory
  let recipient: Contract

  let bundlerAddr: string
  let bundlerUrl: string
  let bundlerProvider: HttpRpcClient
  let entryPointAddress: string

  let SampleRecipient__factory: ContractFactory

  before(async () => {

    if (hre.network.name === 'boba_bnb_testnet') {
      entryPointAddress = BNB_AAAddresses.L2_Boba_EntryPoint
    } else {
      const result = await request.get({
        uri: 'http://127.0.0.1:8080/aa-addr.json',
      })
      entryPointAddress = result.L2_Boba_EntryPoint
    }

    SimpleAccount__factory = new ContractFactory(
      SimpleAccountFactoryJson.abi,
      SimpleAccountFactoryJson.bytecode,
      l2Wallet
    )

    SampleRecipient__factory = new ContractFactory(
      SampleRecipientJson.abi,
      SampleRecipientJson.bytecode,
      l2Wallet
    )

    if (useExistingRecipient) {
      recipient = new Contract(
        recipientAddress,
        SampleRecipientJson.abi,
        l2Wallet,
      )
    } else {
      recipient = await SampleRecipient__factory.deploy()
    }
    console.log('recipient', recipient.address)

    bundlerUrl = (hre.network.config as any).bundler_url
    bundlerAddr = (hre.network.config as any).bundler_addr
    console.log("Using Bundler: ", bundlerUrl)
    if (!bundlerUrl) throw new Error('Bundler URL not defined in Hardhat config!')
    if (!bundlerAddr) throw new Error('Bundler Address not defined in Hardhat config!')
    bundlerProvider = new HttpRpcClient(
      bundlerUrl,
      entryPointAddress,
      await l2Wallet.provider.getNetwork().then((net) => net.chainId)
    )
  })

  it('should be able to send a userOperation to a wallet through the bundler (high level api)', async () => {
 const aasigner = local_provider.getSigner()
    const config = {
      chainId: await local_provider.getNetwork().then(net => net.chainId),
      entryPointAddress,
      bundlerUrl,
    }

    const aaProvider = await wrapProvider(local_provider, config, aasigner, BNB_AAAddresses.L2_EntryPointWrapper, l2Wallet_2, hre.network.name)

    const walletAddress = await aaProvider.getSigner().getAddress()
    await l2Wallet.sendTransaction({
      value: utils.parseEther('0.02'),
      to: walletAddress,
      gasLimit,
    })

    recipient = recipient.connect(aaProvider.getSigner())
    const tx = await recipient.something('hello')
    const receipt = await tx.wait()
    const returnedlogIndex = await getFilteredLogIndex(
      receipt,
      SampleRecipientJson.abi,
      recipient.address,
      'Sender'
    )
    const log = recipient.interface.parseLog(receipt.logs[returnedlogIndex])
    // tx.origin is the bundler
    expect(log.args.txOrigin).to.eq(bundlerAddr)
    // msg.sender is the 4337 wallet
    expect(log.args.msgSender).to.eq(walletAddress)
    // message is received and emitted
    expect(log.args.message).to.eq('hello')
  })
})
