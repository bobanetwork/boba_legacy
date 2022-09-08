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
    this.isETH = this.layerZeroChain.search(/EthBridgeTo/) === 0
    this.latestBlock = 0
    this.currentBlock = this.chainInfo.latestBlock
    this.chainID = this.chainInfo.chainID

    const abi = this.isETH ? EthBridgeJson.abi : AltL1Bridge.abi

    this.bridgeContracts = []
    this.chainInfo.bridgeAddresses.forEach((address) => {
      const contract = new ethers.Contract(address, abi, this.L1Provider)
      this.bridgeContracts.push(contract)
    })
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
        `monitor bridge ${contract.Address} with dstChainID ${destChain}`
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
    console.log(prefix, `start monitor`)
    this.latestBlock = await this.L1Provider.getBlockNumber()

    if (this.currentBlock < this.latestBlock) {
      await this.scanBlockRange(this.currentBlock, this.latestBlock)
    }
  }

  async scanBlockRange(startBlock, endBlock) {
    console.log(prefix, `scan from block ${startBlock} to block ${endBlock}`)
    for (let i = startBlock; i <= endBlock; i += 1000) {
      const upperBlock = Math.min(i + 999, endBlock)
      console.log(prefix, `scan blockRange`, i, upperBlock)

      for (let j = 0; i < this.bridgeContracts.length; j++) {
        await this.scanBlock(
          i,
          upperBlock,
          this.bridgeContracts[j],
          this.bridgeDstChainIDs[j]
        )
      }
      this.currentBlock = upperBlock

      await sleep(1000)
    }
  }

  async scanBlock(startBlock, endBlock, bridgeContract, dstChainID) {
    const logs = await bridgeContract.queryFilter(
      this.isETH
        ? [
          bridgeContract.filters.ERC20DepositInitiated(),
          bridgeContract.filters.ERC20WithdrawalFinalized(),
        ]
        : [
          bridgeContract.filters.WithdrawalInitiated(),
          bridgeContract.filters.DepositFinalized(),
        ],
      Number(startBlock),
      Number(endBlock)
    )

    for (const l of logs) {
      const tx = await l.getTransaction()
      const eventData = {
        chainID: this.chainID,
        targetChain: dstChainID,
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
