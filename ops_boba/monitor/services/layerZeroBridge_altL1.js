#!/usr/bin/env node

const ethers = require('ethers')
const DatabaseService = require('./database.service')
const OptimismEnv = require('./utilities/optimismEnv')
const fetch = require('node-fetch')
const { sleep } = require('@eth-optimism/core-utils')

const AltL1Bridge = require('@boba/contracts/artifacts/contracts/lzTokenBridge/AltL1Bridge.sol/AltL1Bridge.json')

const prefix = '[layer_zero_bridge]'

class LayerZeroBridgeAltL1Monitor extends OptimismEnv {
  constructor() {
    super(...arguments)

    this.databaseService = new DatabaseService()
    this.latestBlock = 0
    this.currentBlock = 0
    this.chainID = this.altL1ChainID

    console.log(prefix, `Address ${this.altL1BridgeAddress}`)
    this.altL1BridgeContract = new ethers.Contract(
      this.altL1BridgeAddress,
      AltL1Bridge.abi,
      this.layerZeroProvider
    )
  }

  async initConnection() {
    this.logger.info(prefix, 'Trying to connect to the network...')
    for (let i = 0; i < 10; i++) {
      try {
        await this.layerZeroProvider.detectNetwork()
        this.logger.info('Successfully connected to the network.')
        break
      } catch (err) {
        if (i < 9) {
          this.logger.info('Unable to connect to network', {
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

    const maxBlockFromDB = await this.databaseService.getNewestBlockFromLayerZeroTx(this.chainID)
    this.currentBlock = this.layerZeroAltL1LatestBlock || maxBlockFromDB

    this.latestBlock = await this.layerZeroProvider.getBlockNumber()
    console.log(
      `latestBlock ${this.latestBlock} currentBlock ${this.currentBlock}`
    )

    if (this.currentBlock < this.latestBlock) {
      await this.scanBlockRange(this.currentBlock, this.latestBlock)
    }
  }

  async startMonitor() {
    this.latestBlock = await this.layerZeroProvider.getBlockNumber()

    console.log(
      `latestBlock ${this.latestBlock} currentBlock ${this.currentBlock}`
    )

    if (this.currentBlock < this.latestBlock) {
      await this.scanBlockRange(this.currentBlock, this.latestBlock)
    }
  }

  async scanBlockRange(startBlock, endBlock) {
    console.log(prefix, `scan from block ${startBlock} to block ${endBlock}`)
    for (let i = startBlock; i <= endBlock; i += 1000) {
      const upperBlock = Math.min(i + 999, endBlock)
      console.log(prefix, `scan blockRange`, i, upperBlock)

      await this.scanBlock(i, upperBlock)
      this.currentBlock = upperBlock

      await sleep(1000)
    }
  }

  async scanBlock(startBlock, endBlock) {
    const logs = await this.altL1BridgeContract.queryFilter(
      this.altL1BridgeContract.filters.DepositFinalized(),
      Number(startBlock),
      Number(endBlock)
    )

    for (const l of logs) {
      console.log(`Found tx`, l)
      const tx = await l.getTransaction()
      const eventData = {
        chainID: this.chainID,
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

module.exports = LayerZeroBridgeAltL1Monitor
