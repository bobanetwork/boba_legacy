#!/usr/bin/env node

const ethers = require('ethers')
const DatabaseService = require('./database.service')
const OptimismEnv = require('./utilities/optimismEnv')
const fetch = require('node-fetch')
const { sleep } = require('@eth-optimism/core-utils')

const EthBridgeJson = require('@boba/contracts/artifacts/contracts/lzTokenBridge/EthBridge.sol/EthBridge.json')

class LayerZeroBridgeMonitor extends OptimismEnv {
  constructor() {
    super(...arguments)

    this.databaseService = new DatabaseService()
    this.latestBlock = 0
    this.currentETHBlock = 0

    console.log(`Address ${this.ethBridgeAddress}`)
    this.ethBridgeContract = new ethers.Contract(
      this.ethBridgeAddress,
      EthBridgeJson.abi,
      this.L1Provider
    )
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
    await this.initOptimismEnv()
  }

  async initScan() {
    console.log(`init MySQL`)
    // Create tables
    await this.databaseService.initMySQL()

    const maxBlockFromDB = await this.databaseService.getNewestBlockFromLayerZeroTx()
    this.currentETHBlock = this.layerZeroEthLatestBlock || maxBlockFromDB

    this.latestBlock = await this.L1Provider.getBlockNumber()

    if (this.currentETHBlock < this.latestBlock) {
      await this.scanBlockRange(this.currentETHBlock, this.latestBlock)
    }
  }

  async startMonitor() {
    this.latestBlock = await this.L1Provider.getBlockNumber()

    if (this.currentETHBlock < this.latestBlock) {
      await this.scanBlockRange(this.currentETHBlock, this.latestBlock)
    }
  }

  async scanBlockRange(startBlock, endBlock) {
    for (let i = startBlock; i <= endBlock; i += 1000) {
      const upperBlock = Math.min(i + 999, endBlock)

      await this.scanBlock(i, upperBlock)
      this.currentETHBlock = upperBlock

      await sleep(1000)
    }
  }

  async scanBlock(startBlock, endBlock) {
    const logs = await this.ethBridgeContract.queryFilter(
      this.ethBridgeContract.filters.ERC20DepositInitiated(),
      Number(startBlock),
      Number(endBlock)
    )

    for (const l of logs) {
      const tx = await l.getTransaction()
      const eventData = {
        hash: l.transactionHash,
        blockHash: l.blockHash,
        blockNumber: l.blockNumber,
        txFrom: tx.from,
        txTo: tx.to,
        l1Token: l.args._l1Token,
        l2Token: l.args._l2Token,
        crossTxFrom: l.args._from,
        crossTxTo: l.args._to,
        amount: l.args._amount,
        event: l.event,
      }

      await this.databaseService.insertLayerZeroTx(eventData)
    }
  }


  errorCatcher(func, param) {
    return (async () => {
      for (let i = 0; i < 2; i++) {
        try {
          return await func(param)
        } catch (error) {
          console.log(`${func}returned an error!`, error)
          await sleep(1000)
        }
      }
    })()
  }
}

module.exports = LayerZeroBridgeMonitor
