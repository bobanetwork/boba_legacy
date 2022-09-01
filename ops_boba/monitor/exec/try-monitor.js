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
  const LayerZeroBridgeMonitor = require('../services/layerZeroBridge')
  const layerZeroBridgeMonitor = new LayerZeroBridgeMonitor()

  await layerZeroBridgeMonitor.initScan()
  await layerZeroBridgeMonitor.startMonitor()
};

; (async () => {
  main().catch()
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
