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
