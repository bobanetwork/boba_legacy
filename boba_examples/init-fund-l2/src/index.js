const ethers = require('ethers')
const chalk = require('chalk')
const { CrossChainMessenger } = require('../../../packages/sdk')
const { loadContract } = require('../../../packages/contracts/dist/index.js')
require('dotenv').config()

const main = async () => {
  const env = process.env

  const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
  const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL
  const ADDRESS_MANAGER_ADDRESS = env.ADDRESS_MANAGER_ADDRESS
  const PRIVATE_KEY = env.PRIVATE_KEY
  const L2_GAS_LIMIT = 1300000
  /*****************************************************/
  /******************** ENTER AMOUNT *******************/
  /*****************************************************/
  const TRANSFER_AMOUNT = ethers.utils.parseEther('0.0001')

  const L1Provider = new ethers.providers.StaticJsonRpcProvider(
    L1_NODE_WEB3_URL
  )
  const L2Provider = new ethers.providers.StaticJsonRpcProvider(
    L2_NODE_WEB3_URL
  )
  const L1Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L1Provider)
  const L2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L2Provider)

  const network = await L1Provider.getNetwork()
  const messenger = new CrossChainMessenger({
    l1SignerOrProvider: L1Wallet,
    l2SignerOrProvider: L2Wallet,
    l1ChainId: network.chainId,
    fastRelayer: false,
  })

  const Lib_AddressManager = loadContract(
    'Lib_AddressManager',
    ADDRESS_MANAGER_ADDRESS,
    L1Provider
  )

  const Proxy__L1CrossDomainMessengerAddress =
    await Lib_AddressManager.getAddress('Proxy__L1CrossDomainMessenger')
  const L2CrossDomainMessengerAddress = await Lib_AddressManager.getAddress(
    'L2CrossDomainMessenger'
  )
  const Proxy__L1StandardBridgeAddress = await Lib_AddressManager.getAddress(
    'Proxy__L1StandardBridge'
  )
  console.log(
    `⭐️ ${chalk.blue('Proxy__L1CrossDomainMessenger address:')} ${chalk.green(
      Proxy__L1CrossDomainMessengerAddress
    )}`
  )
  console.log(
    `⭐️ ${chalk.blue('L2CrossDomainMessenger address:')} ${chalk.green(
      L2CrossDomainMessengerAddress
    )}`
  )
  console.log(
    `⭐️ ${chalk.blue('Proxy__L1StandardBridge address:')} ${chalk.green(
      Proxy__L1StandardBridgeAddress
    )}`
  )

  const Proxy__L1StandardBridge = loadContract(
    'L1StandardBridge',
    Proxy__L1StandardBridgeAddress,
    L1Wallet
  )

  const depositTx = await Proxy__L1StandardBridge.depositETH(
    L2_GAS_LIMIT,
    ethers.utils.formatBytes32String(new Date().getTime().toString()),
    {
      value: TRANSFER_AMOUNT,
    }
  )

  const receiptL1Tx = await depositTx.wait()
  console.log(' got L1->L2 message hash:', receiptL1Tx.transactionHash)

  const currentBlock = await L2Provider.getBlockNumber()
  const fromBlock = currentBlock - 1000 > 0 ? currentBlock - 1000 : 0

  const receiptL2Tx = await messenger.waitForMessageReceipt(depositTx, {
    fromBlock,
  })
  console.log(
    ' completed Deposit! L2 tx hash:',
    receiptL2Tx.transactionReceipt.transactionHash
  )
}

try {
  main()
} catch (error) {
  console.log(error)
}
