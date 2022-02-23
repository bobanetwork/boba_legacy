require('dotenv').config()

module.exports.l1WsUrl = process.env.L1_NODE_WEB3_WS
module.exports.l2WsUrl = process.env.L2_NODE_WEB3_WS
module.exports.l1Url = process.env.L1_NODE_WEB3_URL
module.exports.l2Url = process.env.L2_NODE_WEB3_URL

module.exports.oracleAddresses = (process.env.ORACLE_ADDRESSES || '').split(',')
module.exports.addressManagerAddress = process.env.ADDRESS_MANAGER_ADDRESS
module.exports.l1PoolAddress = process.env.L1_LIQUIDITY_POOL_ADDRESS
module.exports.l2PoolAddress = process.env.L2_LIQUIDITY_POOL_ADDRESS

module.exports.monitoringReconnectSecs =
  parseInt(process.env.MONITORING_RECONNECT_SECS, 10) || 15

module.exports.OMGXNetwork = {
  L1: 'L1',
  L2: 'L2',
}

module.exports.enableTxResponseTime =
  process.env.ENABLE_TX_RESPONSE_TIME === 'true'

module.exports.bobaContractL2Address = process.env.BOBA_CONTRACT_L2_ADDRESS
module.exports.periodicL2Web3Url = process.env.PERIODIC_L2_WEB3_URL

module.exports.periodicTransactionPrivateKey =
  process.env.PERIODIC_TRANSACTION_PRIVATE_KEY

module.exports.periodicIntervalInMinute =
  parseFloat(process.env.PERIODIC_INTERVAL_IN_MINUTE) || 15

module.exports.periodicBobaAmount =
  parseFloat(process.env.PERIODIC_BOBA_AMOUNT) || 5

// module.exports.periodicEthAmount =
//   parseFloat(process.env.PERIODIC_ETH_AMOUNT) || 0.01
