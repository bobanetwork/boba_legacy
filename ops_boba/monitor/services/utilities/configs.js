require('dotenv').config()

module.exports.l1WsUrl = process.env.L1_NODE_WEB3_WS
module.exports.l2WsUrl = process.env.L2_NODE_WEB3_WS

module.exports.l1PoolAddress = process.env.L1_LIQUIDITY_POOL_ADDRESS
module.exports.l2PoolAddress = process.env.L2_LIQUIDITY_POOL_ADDRESS

module.exports.monitoringReconnectSecs =
  parseInt(process.env.MONITORING_RECONNECT_SECS, 10) || 15

module.exports.OMGXNetwork = {
  L1: 'L1',
  L2: 'L2',
}

module.exports.enableTxResponseTime = process.env.ENABLE_TX_RESPONSE_TIME === 'true'
module.exports.rdsEndpoint = process.env.RDS_ENDPOINT
module.exports.rdsPort = 3306
module.exports.rdsDbNameTx = process.env.RDS_DBNAME_TX
module.exports.rdsDbNameReceipt = process.env.RDS_DBNAME_RECEIPT
module.exports.rdsMysqlName = process.env.RDS_MYSQL_NAME
module.exports.rdsMysqlPassword = process.env.RDS_MYSQL_PASSWORD
module.exports.startTimeLog = process.env.LOG_START_TIME
module.exports.startTimeReceipt = process.env.RECEIPT_START_TIME
