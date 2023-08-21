#!/usr/bin/env node
const { sleep } = require('@eth-optimism/core-utils')
require('dotenv').config()

const loop = async (func) => {
  while (true) {
    try {
      await func()
    } catch (error) {
      console.log('Unhandled exception during monitor service', {
        message: error.toString(),
        stack: error.stack,
        code: error.code,
      })
      await sleep(1000)
    }
  }
}

const main = async () => {
  const BlockMonitorService = require('../services/blockMonitor')
  const stateRootMonitorService = require('../services/stateRootMonitor')
  const exitMonitorService = require('../services/exitMonitor')
  const l1BridgeMonitorService = require('../services/l1BridgeMonitor')
  const LayerZeroBridgeMonitor = require('../services/layerZeroBridge')
  const periodicTransactionService = require('../services/periodicTransaction')
  const bobaStrawMonitorService = require('../services/bobaStrawMonitor')
  const balanceMonitorService = require('../services/balanceMonitor')

  // l1 bridge monitor
  const l1BridgeService = new l1BridgeMonitorService()
  await l1BridgeService.initConnection()

  loop(() => l1BridgeService.startL1BridgeMonitor()).catch()
  loop(() => l1BridgeService.startCrossDomainMessageMonitor()).catch()

  // liquidity pool
  const exitService = new exitMonitorService()
  await exitService.initConnection()

  loop(() => exitService.startExitMonitor()).catch()

  // state root
  const stateRootService = new stateRootMonitorService()
  await stateRootService.initConnection()

  loop(() => stateRootService.startStateRootMonitor()).catch()

  // block
  const blockService = new BlockMonitorService()
  await blockService.initConnection()

  try {
    await blockService.initScan()
  } catch (error) {
    ;`Failed to scan initial blocks - error: ${error}`
  }

  loop(() => blockService.startTransactionMonitor()).catch()
  loop(() => blockService.startCrossDomainMessageMonitor()).catch()

  // periodic transaction
  if (process.env.PERIODIC_TRANSACTION_PRIVATE_KEY) {
    const periodicTXService = new periodicTransactionService()
    await periodicTXService.initConnection()
    loop(() => periodicTXService.sendTransactionPeriodically()).catch()
  }

  // boba straw monitor
  if (process.env.BOBASTRAW_CONTACT_ADDRESSES) {
    const bobaStrawService = new bobaStrawMonitorService()
    await bobaStrawService.initConnection()
    loop(() => bobaStrawService.startBobaStrawMonitor()).catch()
  }

  // balance monitor
  if (
    process.env.L1_BALANCE_MONITOR_ADDRESSES ||
    process.env.L2_BALANCE_MONITOR_ADDRESSES
  ) {
    const balanceService = new balanceMonitorService()
    await balanceService.initConnection()
    loop(() => balanceService.startBalanceMonitor()).catch()
  }

  // monitor layerZero bridge
  if (process.env.LAYER_ZERO_BRIDGES) {
    const layerZeroBridgeMonitor = new LayerZeroBridgeMonitor()
    await layerZeroBridgeMonitor.initScan()
    loop(() => layerZeroBridgeMonitor.startMonitor()).catch()
  }
}

;(async () => {
  main().catch()
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
