#!/usr/bin/env node

const configs = require('../services/utilities/configs')
const { sleep } = require('@eth-optimism/core-utils')
const { logger } = require('../services/utilities/logger')
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

const loopLogTx = async () => {
  const ResponseTimeService = require('../services/responseTime.service')
  const responseTimeService = new ResponseTimeService()

  while (true) {
    await responseTimeService.logResponseTime()
    await sleep(5000)
  }
}

const loopTransferTx = async () => {
  const {
    sendTransactionPeriodically,
  } = require('../services/periodicTransaction')

  while (true) {
    await sendTransactionPeriodically()
    await sleep(configs.periodicIntervalInMinute * 60 * 1000)
  }
}

const main = async () => {
  const BlockMonitorService = require('../services/blockMonitor')
  const stateRootMonitorService = require('../services/stateRootMonitor')
  const exitMonitorService = require('../services/exitMonitor')
  const l1BridgeMonitorService = require('../services/l1BridgeMonitor')
  const messageMonitorService = require('../services/messageMonitor')

  // l1 message monitor
  const messageService = new messageMonitorService()
  await messageService.initConnection()

  loop(() => messageService.startMessageMonitor()).catch()

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
  await blockService.initScan()

  loop(() => blockService.startTransactionMonitor()).catch()
  loop(() => blockService.startCrossDomainMessageMonitor()).catch()

  // enable the periodic transaction and check on Mainnet
  if (process.env.STAGE === 'mainnet') {
    if (configs.enableTxResponseTime) {
      loop(() => loopLogTx()).catch()
    }

    const L1_MONITOR_INTERVAL = process.env.L1_MONITOR_INTERVAL || 5 * 60
    const L2_MONITOR_INTERVAL = process.env.L2_MONITOR_INTERVAL || 5 * 60

    const {
      setupProvider,
      validateMonitoring,
    } = require('../services/monitoring')

    if (validateMonitoring()) {
      logger.info('Start addresses monitoring service!')
      setupProvider(
        configs.OMGXNetwork.L1,
        configs.l1Url,
        L1_MONITOR_INTERVAL
      ).catch()
      setupProvider(
        configs.OMGXNetwork.L2,
        configs.l2Url,
        L2_MONITOR_INTERVAL
      ).catch()
    } else {
      logger.error(
        'Addresses Monitoring: Env variables for monitoring is missing!'
      )
    }

    loop(() => loopTransferTx()).catch()
  }
}

;(async () => {
  main().catch()
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
