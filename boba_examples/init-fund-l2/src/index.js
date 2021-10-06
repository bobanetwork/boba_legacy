const ethers = require('ethers')
const chalk = require('chalk')
const { Watcher } = require('../../../packages/core-utils/dist/watcher')
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

  const watcher = new Watcher({
    l1: {
      provider: L1Provider,
      messengerAddress: Proxy__L1CrossDomainMessengerAddress,
    },
    l2: {
      provider: L2Provider,
      messengerAddress: L2CrossDomainMessengerAddress,
    },
  })

  const Proxy__L1StandardBridge = loadContract(
    'L1StandardBridge',
    Proxy__L1StandardBridgeAddress,
    L1Wallet
  )

  const depositTxStatus = await Proxy__L1StandardBridge.depositETH(
    L2_GAS_LIMIT,
    ethers.utils.formatBytes32String(new Date().getTime().toString()),
    {
      value: TRANSFER_AMOUNT,
    }
  )
  await depositTxStatus.wait()
  const [l1ToL2msgHash] = await watcher.getMessageHashesFromL1Tx(
    depositTxStatus.hash
  )
  console.log(' got L1->L2 message hash', l1ToL2msgHash)
  const l2Receipt = await watcher.getL2TransactionReceipt(l1ToL2msgHash)
  console.log(' completed Deposit! L2 tx hash:', l2Receipt.transactionHash)
}

try {
  main()
} catch (error) {
  console.log(error)
}
