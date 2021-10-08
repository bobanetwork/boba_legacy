#!/usr/bin/env node

const ethers = require('ethers')
const DatabaseService = require('./database.service')
const OptimismEnv = require('./utilities/optimismEnv')
const { sleep } = require('@eth-optimism/core-utils')

class messageMonitorService extends OptimismEnv {
  constructor() {
    super(...arguments)

    this.databaseService = new DatabaseService()

    this.latestL2Block = null

    this.startBlock = Number(0)
    this.endBlock =
      Number(this.startBlock) + Number(this.exitMonitorLogInterval)
  }

  async initConnection() {
    this.logger.info('Trying to connect to the L1 network...')
    for (let i = 0; i < 10; i++) {
      try {
        await this.L1Provider.detectNetwork()
        this.logger.info('Successfully connected to the L1 network.')
        break
      } catch (err) {
        if (i < 9) {
          this.logger.info('Unable to connect to L1 network', {
            retryAttemptsRemaining: 10 - i,
          })
          await sleep(1000)
        } else {
          throw new Error(
            `Unable to connect to the L1 network, check that your L1 endpoint is correct.`
          )
        }
      }
    }
    this.logger.info('Trying to connect to the L2 network...')
    for (let i = 0; i < 10; i++) {
      try {
        await this.L2Provider.detectNetwork()
        this.logger.info('Successfully connected to the L2 network.')
        break
      } catch (err) {
        if (i < 9) {
          this.logger.info('Unable to connect to L2 network', {
            retryAttemptsRemaining: 10 - i,
          })
          await sleep(1000)
        } else {
          throw new Error(
            `Unable to connect to the L2 network, check that your L2 endpoint is correct.`
          )
        }
      }
    }

    await this.initOptimismEnv()
    await this.databaseService.initMySQL()
  }

  async startMessageMonitor() {
    const pendingMessages =
      await this.databaseService.getPendingMessageFromReceiptTable()
    const filterPendingMessages = pendingMessages.filter((i) => {
      const timestamp = new Date().getTime()
      if (i.fastRelay) {
        // The message hasn't been relayed after 30 mins
        return (
          Number(i.crossDomainMessageSendTime) * 1000 + 30 * 60 * 1000 <
          timestamp
        )
      } else {
        // The message hasn't been relayed after 2 hours
        return (
          Number(i.crossDomainMessageSendTime) * 1000 +
            2 * 60 * 60 * 1000 +
            7 * 24 * 60 * 60 * 1000 <
          timestamp
        )
      }
    })
    if (filterPendingMessages.length) {
      this.logger.warning('Found missing messages!', {
        numberOfMissingMessages: filterPendingMessages.length,
        data: JSON.parse(JSON.stringify(filterPendingMessages)),
      })
    } else {
      // this.logger.info('All messages have been relayed');
    }
    await sleep(this.messageMonitorInterval)
  }
}

module.exports = messageMonitorService
