const configs = require('./services/utilities/configs')
const ethers = require('ethers')
const L2LiquidityPoolJson = require('@boba/contracts/artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json')
// const { setupProvider } = require('./services/monitoring')
//
// setupProvider(configs.OMGXNetwork.L2, configs.l2Url, 15).catch()
//
// const {
//   sendTransactionPeriodically,
// } = require('./services/periodicTransaction')
//
// sendTransactionPeriodically().catch()

const BlockMonitorService = require('./services/blockMonitor')
// block
const blockService = new BlockMonitorService()

;(async () => {
  await blockService.initConnection()
  await blockService.initScan()

  blockService.startTransactionMonitor().catch()
})().catch(console.error)
