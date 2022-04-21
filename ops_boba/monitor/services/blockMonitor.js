#!/usr/bin/env node

const ethers = require('ethers')
const DatabaseService = require('./database.service')
const OptimismEnv = require('./utilities/optimismEnv')
const fetch = require('node-fetch')
const { sleep } = require('@eth-optimism/core-utils')

class BlockMonitorService extends OptimismEnv {
  constructor() {
    super(...arguments)

    this.databaseService = new DatabaseService()

    this.latestBlock = null
    this.scannedLastBlock = null
    this.lastCheckWhitelist = (new Date().getTime() / 1000).toFixed(0)
    this.lastCheckNonWhitelist = (new Date().getTime() / 1000).toFixed(0)

    this.whitelist = []
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
    // Create tables
    await this.databaseService.initMySQL()

    // get whitelist
    await this.getWhitelist()

    // scan the chain and get the latest number of blocks
    this.latestBlock = await this.L2Provider.getBlockNumber()

    // check the latest block on MySQL
    const latestSQLBlockQuery =
      await this.databaseService.getNewestBlockFromBlockTable()
    const latestSQLBlock = latestSQLBlockQuery[0]['MAX(blockNumber)']

    // get the blocks, transactions and receipts
    // this.logger.info('Fetching the block data...')
    const [blocksData, receiptsData] = await this.getChainData(
      latestSQLBlock,
      Math.min(this.latestBlock, latestSQLBlock + 1000)
    )

    const receipts = {}
    for (const receipt of receiptsData) {
      receipts[receipt.transactionHash] = receipt
    }

    // write the block data into MySQL
    // this.logger.info('Writing the block data...')
    for (const blockData of blocksData) {
      await this.databaseService.insertBlockData(blockData)
      // write the transaction data into MySQL
      if (blockData.transactions.length) {
        for (const transactionData of blockData.transactions) {
          transactionData.timestamp = blockData.timestamp
          transactionData.gasUsed = receipts[transactionData.hash].gasUsed
          await this.databaseService.insertTransactionData(transactionData)
        }
      }
    }

    // write the receipt data into MySQL
    // this.logger.info('Writing the receipt data...')
    for (let receiptData of receiptsData) {
      const correspondingBlock = blocksData.filter(
        (i) => i && i.hash === receiptData.blockHash
      )
      if (correspondingBlock.length) {
        receiptData.timestamp = correspondingBlock[0].timestamp
      } else {
        receiptData.timestamp = (new Date().getTime() / 1000).toFixed(0)
      }

      receiptData = await this.getCrossDomainMessageStatusL2(
        receiptData,
        blocksData
      )
      // if message is cross domain check if message has been finalized
      if (receiptData.crossDomainMessage) {
        receiptData = await this.getCrossDomainMessageStatusL1(receiptData)
      }
      await this.databaseService.insertReceiptData(receiptData)
      await sleep(5)
    }

    // update scannedLastBlock
    this.scannedLastBlock = this.latestBlock
  }

  async startTransactionMonitor() {
    const latestBlock = await this.L2Provider.getBlockNumber()

    if (latestBlock > this.latestBlock) {
      // this.logger.info('Finding new blocks...')
      this.latestBlock = latestBlock

      // get the blocks, transactions and receipts
      // this.logger.info('Fetching the block data...')
      const [blocksData, receiptsData] = await this.getChainData(
        this.scannedLastBlock,
        Math.min(latestBlock, this.latestBlock + 1000)
      )

      const receipts = {}
      for (const receipt of receiptsData) {
        if (receipt && receipt.transactionHash) {
          receipts[receipt.transactionHash] = receipt
        }
      }

      // write the block data into MySQL
      // this.logger.info('Writing the block data...')
      for (const blockData of blocksData) {
        if (!blockData) {
          continue
        }
        await this.databaseService.insertBlockData(blockData)
        // write the transaction data into MySQL
        if (blockData.transactions.length) {
          for (const transactionData of blockData.transactions) {
            transactionData.timestamp = blockData.timestamp
            transactionData.gasUsed = receipts[transactionData.hash].gasUsed
            await this.databaseService.insertTransactionData(transactionData)
          }
        }
      }

      // write the receipt data into MySQL
      // this.logger.info('Writing the receipt data...')
      for (let receiptData of receiptsData) {
        const correspondingBlock = blocksData.filter(
          (i) => i && i.hash === receiptData.blockHash
        )
        if (correspondingBlock.length) {
          receiptData.timestamp = correspondingBlock[0].timestamp
        } else {
          receiptData.timestamp = (new Date().getTime() / 1000).toFixed(0)
        }
        // check if message is cross domain
        receiptData = await this.getCrossDomainMessageStatusL2(
          receiptData,
          blocksData
        )

        // if message is cross domain check if message has been finalized
        if (receiptData.crossDomainMessage) {
          receiptData = await this.getCrossDomainMessageStatusL1(receiptData)
        }

        await this.databaseService.insertReceiptData(receiptData)
      }

      // update scannedLastBlock
      this.scannedLastBlock = this.latestBlock

      // this.logger.info(
      //   `Found block, receipt and transaction data. Sleeping ${this.transactionMonitorInterval} ms...`
      // )
    // } else {
      // this.logger.info('No new block found.');
    }

    await sleep(this.transactionMonitorInterval)
  }

  async startCrossDomainMessageMonitor() {
    // this.logger.info('Searching cross domain messages...')
    const crossDomainData = await this.databaseService.getL2CrossDomainData()

    // counts the number of server request
    let promiseCount = 0

    let checkWhitelist = this.checkTime(this.whitelistString)
    if (checkWhitelist) {
      await this.getWhitelist()
    }
    let checkNonWhitelist = this.checkTime(this.nonWhitelistString)

    if (crossDomainData.length) {
      // this.logger.info('Found cross domain message.')

      for (let receiptData of crossDomainData) {
        if (promiseCount % this.L2sleepThresh === 0) {
          await sleep(2000)
        }
        // if its time check cross domain message finalization
        if (receiptData.fastRelay) {
          receiptData = await this.getCrossDomainMessageStatusL1(receiptData)
        } else if (checkNonWhitelist && !receiptData.fastRelay) {
          receiptData = await this.getCrossDomainMessageStatusL1(receiptData)
        }
        promiseCount = promiseCount + 1

        if (receiptData.crossDomainMessageFinalize) {
          await this.databaseService.updateCrossDomainData(receiptData)
        }
      }
      promiseCount = 0
      // } else {
      // this.logger.info('No waiting cross domain message found.')
    }

    if (checkWhitelist) {
      checkWhitelist = false
    }
    if (checkNonWhitelist) {
      checkNonWhitelist = false
    }

    // this.logger.info(
    //   `End searching cross domain messages. Sleeping ${this.crossDomainMessageMonitorInterval} ms...`
    // )

    await sleep(this.crossDomainMessageMonitorInterval)
  }

  async getChainData(startingBlock, endingBlock) {
    const promisesBlock = []
    const promisesReceipt = []
    for (let i = startingBlock; i <= endingBlock; i++) {
      promisesBlock.push(this.L2Provider.getBlockWithTransactions(i))
      // this.logger.info(`Pushing block`)
    }
    const blocksData = await Promise.all(promisesBlock)
    for (const blockData of blocksData) {
      if (blockData && blockData.transactions.length) {
        blockData.transactions.forEach((i) => {
          promisesReceipt.push(this.L2Provider.getTransactionReceipt(i.hash))
        })
      }
      sleep(2000)
    }
    const receiptsData = await Promise.all(promisesReceipt)

    return [blocksData, receiptsData]
  }

  async getCrossDomainMessageStatusL2(receiptData, blocksData) {
    this.logger.info(`Searching ${receiptData.transactionHash}...`)

    const filteredBlockData = blocksData.filter(
      (i) => i && i.hash === receiptData.blockHash
    )

    let crossDomainMessageSendTime
    let crossDomainMessageEstimateFinalizedTime
    let crossDomainMessage = false
    const crossDomainMessageFinalize = false
    let fastRelay = false

    // Find the transaction that sends message from L2 to L1
    const filteredLogData = receiptData.logs.filter(
      (i) =>
        i.address === this.OVM_L2CrossDomainMessenger &&
        i.topics[0] === ethers.utils.id(
          'SentMessage(address,address,bytes,uint256,uint256)'
        )
    )

    if (filteredLogData.length) {
      crossDomainMessage = true
      // Get message hashes from L2 TX
      for (const logData of filteredLogData) {
        const [sender, message, messageNonce] =
          ethers.utils.defaultAbiCoder.decode(
            ['address', 'bytes', 'uint256'],
            logData.data
          )

        const [target] = ethers.utils.defaultAbiCoder.decode(
          ['address'],
          logData.topics[1]
        )

        if (this.whitelist.includes(target)) {
          fastRelay = true
        }
      }
    }

    if (filteredBlockData.length) {
      crossDomainMessageSendTime = filteredBlockData[0].timestamp
      crossDomainMessageEstimateFinalizedTime = fastRelay
        ? crossDomainMessageSendTime +
          Number(this.l2CrossDomainMessageWaitingTime)
        : crossDomainMessageSendTime + 60 * 60 * 24 * 6
    }

    receiptData.crossDomainMessageSendTime = crossDomainMessageSendTime
    receiptData.crossDomainMessageEstimateFinalizedTime =
      crossDomainMessageEstimateFinalizedTime
    receiptData.crossDomainMessage = crossDomainMessage
    receiptData.crossDomainMessageFinalize = crossDomainMessageFinalize
    receiptData.fastRelay = fastRelay

    return receiptData
  }

  async getCrossDomainMessageStatusL1(receiptData) {
    // this.logger.info('Checking if message has been finalized...')
    const receiptDataRaw = await this.L2Provider.getTransactionReceipt(
      receiptData.transactionHash
        ? receiptData.transactionHash
        : receiptData.hash
    )
    receiptData = {
      ...JSON.parse(JSON.stringify(receiptData)),
      ...receiptDataRaw,
    }
    const l2CrossDomainMessengerRelayAbi = [
      'function relayMessage(address _target,address _sender,bytes memory _message,uint256 _messageNonce)',
    ]
    const l2CrossDomainMessengerRelayinterface = new ethers.utils.Interface(
      l2CrossDomainMessengerRelayAbi
    )
    // Find the transaction that sends message from L2 to L1
    const filteredLogData = receiptData.logs.filter(
      (i) =>
        i.address === this.OVM_L2CrossDomainMessenger &&
        i.topics[0] ===
          ethers.utils.id('SentMessage(address,address,bytes,uint256,uint256)')
    )
    let msgHash
    if (filteredLogData.length) {
      const [sender, message, messageNonce] =
        ethers.utils.defaultAbiCoder.decode(
          ['address', 'bytes', 'uint256'],
          filteredLogData[0].data
        )
      const [target] = ethers.utils.defaultAbiCoder.decode(
        ['address'],
        filteredLogData[0].topics[1]
      )
      const encodedMessage =
        l2CrossDomainMessengerRelayinterface.encodeFunctionData(
          'relayMessage',
          [target, sender, message, messageNonce]
        )
      msgHash = ethers.utils.solidityKeccak256(['bytes'], [encodedMessage])
    } else {
      return receiptData
    }

    let crossDomainMessageFinalize = false
    let crossDomainMessageFinalizedTime

    const matches = await this.getL1TransactionReceipt(
      msgHash,
      receiptData.fastRelay
    )
    if (matches !== false) {
      const l1Receipt = await this.L1Provider.getTransactionReceipt(
        matches[0].transactionHash
      )
      crossDomainMessageFinalize = true
      crossDomainMessageFinalizedTime = (new Date().getTime() / 1000).toFixed(0)
      receiptData.l1Hash = l1Receipt.transactionHash.toString()
      receiptData.l1BlockNumber = Number(l1Receipt.blockNumber.toString())
      receiptData.l1BlockHash = l1Receipt.blockHash.toString()
      receiptData.l1From = l1Receipt.from.toString()
      receiptData.l1To = l1Receipt.to.toString()

      const L1LiquidityPoolLog = await this.L1LiquidityPoolContract.queryFilter(
        this.L1LiquidityPoolContract.filters.ClientPayL1(),
        Number(receiptData.l1BlockNumber),
        Number(receiptData.l1BlockNumber)
      )
      const tokenReceivers = L1LiquidityPoolLog.reduce((acc, cur) => {
        acc.push(this.L1LiquidityPoolInterface.parseLog(cur).args.sender)
        return acc
      }, [])
      if (tokenReceivers.includes(receiptData.from)) {
        this.logger.info('Found successful L2 exit', {
          status: 'succeeded',
          blockNumber: receiptData.blockNumber,
        })
        await this.databaseService.updateExitData({
          status: 'succeeded',
          blockNumber: receiptData.blockNumber,
        })
      } else {
        if (receiptData.fastRelay) {
          this.logger.info('Found failure L2 exit', {
            status: 'reverted',
            blockNumber: receiptData.blockNumber,
          })
          await this.databaseService.updateExitData({
            status: 'reverted',
            blockNumber: receiptData.blockNumber,
          })
        } else {
          this.logger.info('Found successful L2 exit', {
            status: 'succeeded',
            blockNumber: receiptData.blockNumber,
          })
          await this.databaseService.updateExitData({
            status: 'succeeded',
            blockNumber: receiptData.blockNumber,
          })
        }
      }
    }

    receiptData.crossDomainMessageFinalize = crossDomainMessageFinalize
    receiptData.crossDomainMessageFinalizedTime =
      crossDomainMessageFinalizedTime

    // this.logger.info('Found the cross domain message status', {
    //   crossDomainMessageFinalize,
    //   crossDomainMessageFinalizedTime,
    // })

    return receiptData
  }

  async getL1TransactionReceipt(msgHash, fast = false) {
    const blockNumber = await this.L1Provider.getBlockNumber()
    const startingBlock = Math.max(blockNumber - this.numberBlockToFetch, 0)

    const filter = {
      address: fast
        ? this.L1CrossDomainMessengerFast
        : this.L1CrossDomainMessenger,
      topics: [ethers.utils.id(`RelayedMessage(bytes32)`)],
      fromBlock: startingBlock,
    }

    const logs = await this.L1Provider.getLogs(filter)
    const matches = logs.filter((i) => i.topics[1] === msgHash)

    if (matches.length > 0) {
      if (matches.length > 1) {
        return false
      }
      return matches
    } else {
      return false
    }
  }

  // gets list of addresses whose messages may finalize fast
  async getWhitelist() {
    try {
      const response = await fetch(this.filterEndpoint)
      const filter = await response.json()
      const filterSelect = [filter.Proxy__L1LiquidityPool, filter.L1Message]
      this.whitelist = filterSelect
      this.logger.info('Found the filter', { filterSelect })
    } catch (error) {
      this.logger.error(`CRITICAL ERROR: Failed to fetch the Filter - error: ${error}`)
    }
  }

  // checks to see if its time to look for L1 finalization
  checkTime(list) {
    const currentTime = (new Date().getTime() / 1000).toFixed(0)
    if (list === this.whitelistString) {
      if (currentTime - this.lastCheckWhitelist >= this.whitelistSleep) {
        this.lastCheckWhitelist = currentTime
        return true
      }
    } else if (list === this.nonWhitelistString) {
      if (currentTime - this.lastCheckNonWhitelist >= this.nonWhitelistSleep) {
        this.lastCheckNonWhitelist = currentTime
        return true
      }
    }
    return false
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

module.exports = BlockMonitorService
