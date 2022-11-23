#!/usr/bin/env node

const ethers = require('ethers')
const DatabaseService = require('./database.service')
const OptimismEnv = require('./utilities/optimismEnv')
const fetch = require('node-fetch')
const { sleep } = require('@eth-optimism/core-utils')
const { Logger } = require('@eth-optimism/common-ts')

const EthBridgeJson = require('@boba/contracts/artifacts/contracts/lzTokenBridge/EthBridge.sol/EthBridge.json')
const AltL1Bridge = require('@boba/contracts/artifacts/contracts/lzTokenBridge/AltL1Bridge.sol/AltL1Bridge.json')

const layerZeroMainnetAddresses = require('@boba/register/addresses/layerZeroMainnet.json')
const layerZeroTestnetAddresses = require('@boba/register/addresses/layerZeroTestnet.json')

const prefix = '[layer_zero_bridge]'
class LayerZeroBridgeMonitor extends OptimismEnv {
  constructor() {
    super(...arguments)

    this.databaseService = new DatabaseService()


    const layerZeroAddresses = this.layerZeroEnableTest
      ? layerZeroTestnetAddresses
      : layerZeroMainnetAddresses;

    this.layerZeroURL = this.layerZeroEnableTest
      ? 'https://api-testnet.layerzero-scan.com/tx/'
      : 'https://api-mainnet.layerzero-scan.com/tx/'

    if (layerZeroAddresses.BOBA_Bridges[this.layerZeroChain] === undefined) {
      throw new Error(
        `Unable to find bridge address for ${this.layerZeroChain}`
      )
    }

    const bridgeAddresses = []
    this.layerZeroBridges.forEach((bridgeName) => {
      bridgeAddresses.push(
        layerZeroAddresses.BOBA_Bridges[this.layerZeroChain][bridgeName]
      )
    })

    this.chainInfo = {
      bridgeAddresses,
      latestBlock: this.layerZeroLatestBlock,
      chainID:
        layerZeroAddresses.Layer_Zero_Protocol[this.layerZeroChain]
          .Layer_Zero_ChainId,
    }
    console.log(
      prefix,
      `monitoring ${this.layerZeroChain} with ${JSON.stringify(this.chainInfo)}`
    )
    this.latestBlock = 0
    this.currentBlock = this.chainInfo.latestBlock
    this.chainID = this.chainInfo.chainID

    this.bridgeContracts = []
    for (let i = 0; i < this.layerZeroBridges.length; i++) {
      const bridgeName = this.layerZeroBridges[i]
      const isFromETH = bridgeName.search(/EthBridgeTo/) > -1
      const abi = isFromETH ? EthBridgeJson.abi : AltL1Bridge.abi
      const contract = new ethers.Contract(
        bridgeAddresses[i],
        abi,
        this.L1Provider
      )
      this.bridgeContracts.push(contract)
    }
  }

  async initScan() {
    console.log(prefix, `init MySQL`)
    // Create tables
    await this.databaseService.initMySQL()

    this.bridgeDstChainIDs = []
    for (let i = 0; i < this.bridgeContracts.length; i++) {
      const destChainID = await this.bridgeContracts[i].dstChainId()
      this.bridgeDstChainIDs.push(destChainID)
      console.log(
        prefix,
        `monitor bridge ${this.bridgeContracts[i].address} with dstChainID ${destChainID}`
      )
    }

    const maxBlockFromDB = await this.databaseService.getNewestBlockFromLayerZeroTx(this.chainID)
    this.currentBlock = this.currentBlock > maxBlockFromDB ? this.currentBlock : maxBlockFromDB

    this.latestBlock = await this.L1Provider.getBlockNumber()
    console.log(prefix, `latestBlock ${this.latestBlock}`)

    if (this.currentBlock < this.latestBlock) {
      await this.scanBlockRange(this.currentBlock, this.latestBlock)
    }
  }

  async startMonitor() {
    this.latestBlock = await this.L1Provider.getBlockNumber()

    if (this.currentBlock < this.latestBlock) {
      await this.scanBlockRange(this.currentBlock, this.latestBlock)
    }
    await sleep(60000)
  }

  async scanBlockRange(startBlock, endBlock) {
    for (let i = startBlock; i <= endBlock; i += 1000) {
      const upperBlock = Math.min(i + 999, endBlock)

      for (let j = 0; j < this.bridgeContracts.length; j++) {
        await this.scanBlock(
          i,
          upperBlock,
          this.layerZeroBridges[j],
          this.bridgeContracts[j],
          this.bridgeDstChainIDs[j]
        )
      }
      this.currentBlock = upperBlock

      await sleep(1000)
    }
  }

  async scanBlock(startBlock, endBlock, bridgeName, bridgeContract, dstChainID) {
    const getEvents = async (events, startBlock, endBlock) => {
      let logs = []
      for (const event of events) {
        const log = await bridgeContract.queryFilter(
          event,
          Number(startBlock),
          Number(endBlock)
        )
        logs = logs.concat(log)
      }
      return logs
    }

    let logs = []
    if (bridgeName.search(/EthBridgeTo/) > -1) {
      logs = await getEvents(
        [
          bridgeContract.filters.ERC20DepositInitiated(),
          bridgeContract.filters.ERC20WithdrawalFinalized(),
        ],
        startBlock,
        endBlock
      )
    } else {
      logs = await getEvents(
        [
          bridgeContract.filters.WithdrawalInitiated(),
          bridgeContract.filters.DepositFinalized(),
        ],
        startBlock,
        endBlock
      )
    }

    if (logs.length !== 0) {
      console.log(prefix, `found events from ${startBlock} to ${endBlock}`)
    }

    for (const l of logs) {
      const eventNames = [
        'ERC20DepositInitiated',
        'ERC20WithdrawalFinalized',
        'WithdrawalInitiated',
        'DepositFinalized',
      ]
      if (!eventNames.includes(l.event)) {
        continue
      }

      const tx = await l.getTransaction()
      const block = await this.L1Provider.getBlock(l.blockNumber)
      const response = await fetch(this.layerZeroURL + l.transactionHash)
      const result = await response.json()

      let url = ''
      if (result.messages.length > 0) {
        const message = result.messages[0]
        // [
        //   {
        //     srcUaAddress: '0x9d1b1669c73b033dfe47ae5a0164ab96df25b944',
        //     dstUaAddress: '0x352d8275aae3e0c2404d9f68f6cee084b5beb3dd',
        //     updated: 1662991680,
        //     created: 1662991522,
        //     srcChainId: 106,
        //     dstChainId: 110,
        //     dstTxHash: '0xed243b4f381971719cc3799f5f989f8d4344fcfebf46224d92370b432d381208',
        //     dstTxError: null,
        //     srcTxHash: '0x05efb7a5f9dfc90c999c63c81c28de17c23d2233850a732fe411c01c74053e0d',
        //     srcBlockHash: '0x318285210d3951b3b3895258d5cdd8181677ee02e15a5424036ff595d8b37318',
        //     srcBlockNumber: '19798751',
        //     srcUaNonce: 93,
        //     status: 'DELIVERED'
        //   }
        // ]
        // https://layerzeroscan.com/106/address/0x9d1b1669c73b033dfe47ae5a0164ab96df25b944/message/110/address/0x352d8275aae3e0c2404d9f68f6cee084b5beb3dd/nonce/93
        url = `https://layerzeroscan.com/${message.srcChainId}/address/${message.srcUaAddress}/message/${message.dstChainId}/address/${message.dstUaAddress}/nonce/${message.srcUaNonce}`
      }

      const eventData = {
        chainID: this.chainID,
        targetChainID: dstChainID,
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
        timestamp: block.timestamp,
        reference: url,
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
