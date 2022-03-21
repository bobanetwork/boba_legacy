const { Contract, providers, Wallet, ethers, utils } = require('ethers')
const { getContractFactory } = require('@eth-optimism/contracts')
const { Watcher } = require('../../../packages/core-utils/dist/watcher')
const chalk = require('chalk')
require('dotenv').config()

const SampleERC721Json = require('../quickStart-Rinkeby/SampleERC721.json')
const L1StandardERC721Json = require('@boba/contracts/artifacts/contracts/standards/L1StandardERC721.sol/L1StandardERC721.json')
const L1NFTBridgeJson = require('@boba/contracts/artifacts/contracts/bridges/L1NFTBridge.sol/L1NFTBridge.json')
const L2NFTBridgeJson = require('@boba/contracts/artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json')

const { bridgeToL1 } = require('./bridgeToL1')
const { bridgeBackToL2 } = require('./bridgeBackToL2')

const main = async () => {
  const env = process.env
  const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
  const L2_NODE_WEB3_URL = 'https://rinkeby.boba.network'
  const ADDRESS_MANAGER_ADDRESS = '0x93A96D6A5beb1F661cf052722A1424CDDA3e9418'
  const PRIV_KEY = env.PRIV_KEY
  const L2ERC721Address = '0x8b9BB8EcB0F9C4328D6eB78947bfAa6eb2B2F289'
  const L1ERC721Address = '0xDF24419631cfA7d0660cAa7BF2C23481f0361045'

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

  // deposit some eth to L2
  const L1StandardBridgeAddress = await addressManager.getAddress(
    'Proxy__L1StandardBridge'
  )

  const L1StandardBridge = getContractFactory(
    'L1StandardBridge',
    l1Wallet
  ).attach(L1StandardBridgeAddress)

  console.log(
    'Bridging some Rinkeby ETH over to Boba, please wait for around 3 mins...'
  )

  const depositTx = await L1StandardBridge.depositETH(8_000_000, '0x', {
    value: utils.parseEther('0.01'),
    gasLimit: 2_000_000,
  })

  await depositTx.wait()

  const [msgHashDeposit] = await watcher.getMessageHashesFromL1Tx(
    depositTx.hash
  )
  await watcher.getL2TransactionReceipt(msgHashDeposit)

  console.log('Bridged ETH to L2')

  console.log('*********************************')
  console.log(
    'Currently, you would have to reach out to the Boba team, in order to'
  )
  console.log(
    'have your very own ERC721 contract to be used on the Boba NFT Bridges on Rinkeby'
  )
  console.log(
    'For the sake of this tutorial, we have pre-deployed a bridgeable ERC721 contract pair for you to use'
  )
  console.log('*********************************')

  const L2ERC721 = new Contract(L2ERC721Address, SampleERC721Json.abi, l2Wallet)
  console.log('Fetched the base NFT contract on L2: ', L2ERC721.address)

  const L1StandardERC721 = new Contract(
    L1ERC721Address,
    L1StandardERC721Json.abi,
    l1Wallet
  )

  console.log(
    'Fetched the L1 NFT Representation contract: ',
    L1StandardERC721.address
  )

  // mint one NFT to your address
  const mintTx = await L2ERC721.mint(l2Wallet.address)

  // get tokenId minted
  const receipt = await mintTx.wait()
  const iface = new ethers.utils.Interface(SampleERC721Json.abi)
  const log = iface.parseLog(receipt.logs[0])
  const tokenId = log.args.tokenId
  console.log('\nAnd, Minted an NFT#', tokenId.toString(), ' to your address')

  const L1NFTBridgeAddress = await addressManager.getAddress(
    'Proxy__L1NFTBridge'
  )
  const L2NFTBridgeAddress = await addressManager.getAddress(
    'Proxy__L2NFTBridge'
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

  console.log(
    chalk.yellow('Attempting to Bridge NFT#', tokenId.toString(), 'to L1')
  )

  const withdrawTxHash = await bridgeToL1(L2ERC721, L2NFTBridge, tokenId)

  // Wait for the message to be relayed to L1.
  console.log('Waiting for withdrawal to be relayed to L1...')
  console.log(
    chalk.green(
      'Succesfully initiated withdrawal to L1, bridging will be complete after fraud proof window!'
    )
  )
  const [msgHash1] = await watcher.getMessageHashesFromL2Tx(withdrawTxHash)
//   await watcher.getL1TransactionReceipt(msgHash1)

//   const L1NFTOwner = await L1StandardERC721.ownerOf(tokenId)
//   console.log('#################################')
//   console.log('Your address: ', l1Wallet.address)
//   console.log('L1NFT owner: ', L1NFTOwner)
//   console.log(chalk.green('NFT bridged to L1 successfully!'))
//   console.log('#################################')
}

try {
  main()
} catch (error) {
  console.log(error)
}
