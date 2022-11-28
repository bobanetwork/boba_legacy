#!/usr/bin/env node

const DatabaseService = require('./database.service')
const OptimismEnv = require('./utilities/optimismEnv')
const { sleep } = require('@eth-optimism/core-utils')
const { utils } = require('ethers')

class TeleportationMonitorService extends OptimismEnv {
  constructor() {
    super(...arguments)

    this.databaseService = new DatabaseService()

    this.latestBlock = null
    this.scannedLastBlock = null
    this.chainId = null
    this.disburserAddress = null
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
  }

  async initScan() {
    // create tables
    await this.databaseService.initMySQL()

    // get chain id
    this.chainId = (await this.L2Provider.getNetwork()).chainId

    // get disburser address
    this.disburserAddress = await this.TeleportationContract.disburser()

    // check the latest block on MySQL
    const latestSQLBlockQuery =
      await this.databaseService.getNewestBlockFromTeleportationTable()
    this.scannedLastBlock =
      latestSQLBlockQuery[0]['MAX(blockNumber)'] ||
      this.TeleportationContractHeight
  }

  async startTeleportationMonitor() {
    // scan the chain and get the latest number of blocks
    this.latestBlock = await this.L2Provider.getBlockNumber()

    const eventsBobaReceived = await this.getTeleportationEvents(
      this.TeleportationContract.filters.BobaReceived(),
      this.latestBlock
    )
    await this.updateTeleportationTable(eventsBobaReceived, 'BobaReceived')
    const eventsDisbursement = await this.getTeleportationEvents(
      this.TeleportationContract.filters.DisbursementSuccess(),
      this.latestBlock
    )
    await this.updateTeleportationTable(
      eventsDisbursement,
      'DisbursementSuccess'
    )

    await this.reportBalance()
    await sleep(60000)
  }

  async getTeleportationEvents(event, toBlock) {
    let events = []
    let startBlock = this.scannedLastBlock
    while (startBlock < toBlock) {
      const endBlock = Math.min(
        startBlock + this.teleportationBlockRangePerPolling,
        toBlock
      )
      const partialEvents = await this.TeleportationContract.queryFilter(
        event,
        startBlock,
        endBlock
      )
      events = [...events, ...partialEvents]
      startBlock = endBlock
    }
    this.scannedLastBlock = toBlock
    return events
  }

  async updateTeleportationTable(events, eventName) {
    for (const event of events) {
      const sourceChainId = event.args.sourceChainId
      const toChainId = event.args.toChainId
      const amount = event.args.amount
      const emitter = event.args.emitter
      const hash = event.transactionHash
      const blockNumber = event.blockNumber
      const blockHash = event.blockHash

      await this.databaseService.insertTeleportationData({
        sourceChainId,
        toChainId,
        amount,
        emitter,
        hash,
        blockNumber,
        blockHash,
        event: eventName,
      })
    }
  }

  async reportBalance() {
    const ethBalance = await this.L2Provider.getBalance(this.disburserAddress)
    const bobaBalance = await this.L2BOBAContract.balanceOf(
      this.disburserAddress
    )
    this.logger.info('Got disburser balance', {
      ETHBalance: Number(
        Number(utils.formatEther(ethBalance.toString())).toFixed(6)
      ),
      BOBABalance: Number(
        Number(utils.formatEther(bobaBalance.toString())).toFixed(6)
      ),
    })
  }
}

module.exports = TeleportationMonitorService
