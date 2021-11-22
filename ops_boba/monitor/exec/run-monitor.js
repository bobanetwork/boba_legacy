#!/usr/bin/env node

const mysql = require('mysql')
const util = require('util')
const configs = require('../services/utilities/configs')
const { sleep } = require('@eth-optimism/core-utils')
const { logger } = require('../services/utilities/logger')

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
  while (true) {
    try {
      await getLatestTx()
    } catch (error) {
      logger.error('Unhandled exception during logging tx', {
        message: error.toString(),
        stack: error.stack,
        code: error.code,
      })
    }
    try {
      await getLatestReceipt()
    } catch (error) {
      logger.error('Unhandled exception during logging receipt', {
        message: error.toString(),
        stack: error.stack,
        code: error.code,
      })
    }
    await sleep(5000)
  }
}

const getLatestTx = async () => {
  const con = mysql.createConnection({
    host: configs.rdsEndpoint,
    port: configs.rdsPort,
    user: configs.rdsMysqlName,
    password: configs.rdsMysqlPassword,
  })

  const query = util.promisify(con.query).bind(con)
  await query(`USE ${configs.rdsDbNameTx}`)
  const txs = await query(
    `SELECT * FROM tx WHERE startTime>${configs.startTimeLog} ORDER BY startTime LIMIT 10`
  )

  if (txs.length > 0) {
    txs.forEach((tx, index) => {
      if (index === txs.length - 1) {
        configs.startTimeLog = `${tx.startTime}`
      }
      tx.startTime = parseInt(`${tx.startTime}`, 10)
      tx.endTime = parseInt(`${tx.endTime}`, 10)
      tx.duration = tx.endTime - tx.startTime
      tx.endISOTime = new Date(parseInt(`${tx.endTime}`, 10)).toISOString()
      tx.startISOTime = new Date(parseInt(`${tx.startTime}`, 10)).toISOString()
      logger.info('tx', tx)
    })
  }
  con.end()
}

const getLatestReceipt = async () => {
  const con = mysql.createConnection({
    host: configs.rdsEndpoint,
    port: configs.rdsPort,
    user: configs.rdsMysqlName,
    password: configs.rdsMysqlPassword,
  })

  const query = util.promisify(con.query).bind(con)
  await query(`USE ${configs.rdsDbNameReceipt}`)
  const receipts = await query(
    `SELECT * FROM receipt WHERE crossDomainMessageSendTime>${configs.startTimeReceipt}
        AND crossDomainMessageFinalize=1
        ORDER BY crossDomainMessageSendTime LIMIT 10`
  )

  if (receipts.length > 0) {
    receipts.forEach((tx, index) => {
      if (index === receipts.length - 1) {
        configs.startTimeReceipt = tx.crossDomainMessageSendTime
      }

      tx.duration =
        tx.crossDomainMessageFinalizedTime - tx.crossDomainMessageSendTime

      tx.crossDomainMessageSendISOTime = new Date(
        tx.crossDomainMessageSendTime
      ).toISOString()

      tx.crossDomainMessageFinalizedISOTime = new Date(
        tx.crossDomainMessageFinalizedTime
      ).toISOString()
      logger.info('receipt', tx)
    })
  }
  con.end()
}

const main = async () => {
  if (configs.isLogTx) {
    loopLogTx()
  }

  const {
    setupProvider,
    validateMonitoring,
  } = require('../services/monitoring')

  if (validateMonitoring()) {
    logger.info('Start addresses monitoring service!')
    setupProvider(configs.OMGXNetwork.L1, configs.l1WsUrl)
    // setupProvider(configs.OMGXNetwork.L2, configs.l2WsUrl)
    return
  } else {
    logger.error(
      'Addresses Monitoring: Env variables for monitoring is missing!'
    )
  }

  const BlockMonitorService = require('../services/blockMonitor')
  const stateRootMonitorService = require('../services/stateRootMonitor')
  const exitMonitorService = require('../services/exitMonitor')
  const l1BridgeMonitorService = require('../services/l1BridgeMonitor')
  const messageMonitorService = require('../services/messageMonitor')

  // l1 message monitor
  const messageService = new messageMonitorService()
  await messageService.initConnection()

  loop(() => messageService.startMessageMonitor())

  // l1 bridge monitor
  const l1BridgeService = new l1BridgeMonitorService()
  await l1BridgeService.initConnection()

  loop(() => l1BridgeService.startL1BridgeMonitor())
  loop(() => l1BridgeService.startCrossDomainMessageMonitor())

  // liquidity pool
  const exitService = new exitMonitorService()
  await exitService.initConnection()

  loop(() => exitService.startExitMonitor())

  // state root
  const stateRootService = new stateRootMonitorService()
  await stateRootService.initConnection()

  loop(() => stateRootService.startStateRootMonitor())

  // block
  const blockService = new BlockMonitorService()
  await blockService.initConnection()
  await blockService.initScan()

  loop(() => blockService.startTransactionMonitor())
  loop(() => blockService.startCrossDomainMessageMonitor())
}

;(async () => {
  main()
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
