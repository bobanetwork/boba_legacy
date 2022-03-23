const { Contract, providers, Wallet, ContractFactory } = require('ethers')
const { getContractFactory } = require('@eth-optimism/contracts')
const { Watcher } = require('../../../packages/core-utils/dist/watcher')
const chalk = require('chalk')
require('dotenv').config()

const SampleERC721Json = require('../artifacts/contracts/SampleERC721.sol/SampleERC721.json')
const L1StandardERC721Json = require('@boba/contracts/artifacts/contracts/standards/L1StandardERC721.sol/L1StandardERC721.json')
const L1NFTBridgeJson = require('@boba/contracts/artifacts/contracts/bridges/L1NFTBridge.sol/L1NFTBridge.json')
const L2NFTBridgeJson = require('@boba/contracts/artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json')

const { bridgeToL1 } = require('./bridgeToL1')
const { bridgeBackToL2 } = require('./bridgeBackToL2')

const main = async () => {
  const env = process.env
  const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
  const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL
  const ADDRESS_MANAGER_ADDRESS = env.ADDRESS_MANAGER_ADDRESS
  const PRIV_KEY = env.PRIV_KEY

  // provider
  const l1Provider = new providers.JsonRpcProvider(L1_NODE_WEB3_URL)
  const l2Provider = new providers.JsonRpcProvider(L2_NODE_WEB3_URL)
  const l1Wallet = new Wallet(PRIV_KEY).connect(l1Provider)
  const l2Wallet = new Wallet(PRIV_KEY).connect(l2Provider)

  // load contract
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect(l1Wallet)
    .attach(ADDRESS_MANAGER_ADDRESS)

  const L1MessengerAddress = await addressManager.getAddress(
    'Proxy__L1CrossDomainMessenger'
  )
  const L2MessengerAddress = await addressManager.getAddress(
    'L2CrossDomainMessenger'
  )

  // fetch watcher
  const watcher = new Watcher({
    l1: {
      provider: l1Provider,
      messengerAddress: L1MessengerAddress,
    },
    l2: {
      provider: l2Provider,
      messengerAddress: L2MessengerAddress,
    },
  })

  const Factory__L2ERC721 = new ContractFactory(
    SampleERC721Json.abi,
    SampleERC721Json.bytecode,
    l2Wallet
  )

  console.log('Deploying the NFT contract on L2...')
  const L2ERC721 = await Factory__L2ERC721.deploy()
  await L2ERC721.deployTransaction.wait()

  console.log('Deployed the NFT contract at:', L2ERC721.address)

  // mint one NFT
  await L2ERC721.mint(l2Wallet.address, 1)
  await L2ERC721.mint(l2Wallet.address, 2)
  console.log('And, Minted some NFTs to address')
  console.log('*********************************')
  console.log(
    'Now, we will allow all L2 NFTs from this contract to be bridgeable to L1'
  )
  console.log(
    'To enable that, we need to deploy a bridge-compliant L1ERC721 representation...'
  )
  console.log('*********************************')

  const L1NFTBridgeAddress = await addressManager.getAddress(
    'Proxy__L1NFTBridge'
  )
  const L2NFTBridgeAddress = await addressManager.getAddress(
    'Proxy__L2NFTBridge'
  )

  const Factory__L1StandardERC721 = new ContractFactory(
    L1StandardERC721Json.abi,
    L1StandardERC721Json.bytecode,
    l1Wallet
  )

  const L1StandardERC721 = await Factory__L1StandardERC721.deploy(
    L1NFTBridgeAddress,
    L2ERC721.address,
    'NFT Representation',
    'NFTR',
    '' // base-uri
  )
  await L1StandardERC721.deployTransaction.wait()
  console.log(
    'Deployed the L1 NFT Representaton contract at:',
    L1StandardERC721.address
  )

  const L1NFTBridge = new Contract(
    L1NFTBridgeAddress,
    L1NFTBridgeJson.abi,
    l1Wallet
  )

  const L2NFTBridge = new Contract(
    L2NFTBridgeAddress,
    L2NFTBridgeJson.abi,
    l2Wallet
  )

  await L1NFTBridge.registerNFTPair(
    L1StandardERC721.address,
    L2ERC721.address,
    'L2' // base network
  )

  await L2NFTBridge.registerNFTPair(
    L1StandardERC721.address,
    L2ERC721.address,
    'L2' // base network
  )

  console.log(
    'And registered the L2ERC721 and L1ERC721 to the NFTBridges! \n \n '
  )

  console.log(chalk.yellow('Attempting to Bridge NFT#1 to L1'))

  const withdrawTxHash = await bridgeToL1(L2ERC721, L2NFTBridge, 1)

  // Wait for the message to be relayed to L1.
  console.log('Waiting for withdrawal to be relayed to L1...')
  const [msgHash1] = await watcher.getMessageHashesFromL2Tx(withdrawTxHash)
  await watcher.getL1TransactionReceipt(msgHash1)

  const L1NFTOwner = await L1StandardERC721.ownerOf(1)
  console.log('#################################')
  console.log('Your address: ', l1Wallet.address)
  console.log('L1NFT owner: ', L1NFTOwner)
  console.log(chalk.green('NFT bridged to L1 successfully!'))
  console.log('#################################')

  console.log(chalk.yellow('\n \nAttempting to bridge NFT#1 back to L2'))
  const depositTxHash = await bridgeBackToL2(L1StandardERC721, L1NFTBridge, 1)
  console.log('Waiting for deposit to be relayed to L2...')
  const [msgHash2] = await watcher.getMessageHashesFromL1Tx(depositTxHash)
  await watcher.getL2TransactionReceipt(msgHash2)

  const L2NFTOwner = await L2ERC721.ownerOf(1)
  console.log('#################################')
  console.log('Your address: ', l2Wallet.address)
  console.log('L2NFT owner: ', L2NFTOwner)
  console.log(chalk.green('NFT bridged back to L2 successfully!'))
  console.log('#################################')
}

try {
  main()
} catch (error) {
  console.log(error)
}
