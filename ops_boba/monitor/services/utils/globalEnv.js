#!/usr/bin/env node

const ethers = require('ethers')
const { getContractFactory } = require('@eth-optimism/contracts')
const { getBobaContractAt, getBobaContractABI } = require('@boba/contracts')
const { CrossChainMessenger, isChainIDForGraph } = require('@eth-optimism/sdk')
const { Logger } = require('@eth-optimism/common-ts')
const fetch = require('node-fetch')

const { removeBlankStringInArray } = require('./utils')

require('dotenv').config()

const second = 1000
const minute = 60 * 1000
const hour = 60 * 60 * 1000

/* eslint-disable */
const env = process.env
const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL || 'http://localhost:8545'
const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL || 'http://localhost:9545'

const MYSQL_HOST_URL = env.MYSQL_HOST_URL || '127.0.0.1'
const MYSQL_PORT = env.MYSQL_PORT || 3306
const MYSQL_USERNAME = env.MYSQL_USERNAME
const MYSQL_PASSWORD = env.MYSQL_PASSWORD
const MYSQL_DATABASE_NAME = env.MYSQL_DATABASE_NAME || 'BOBAV1'
const MYSQL_DBNAME_TX = `${env.MYSQL_DATABASE_NAME}CDM`

const BOBA_DEPLOYER_URL = env.BOBA_DEPLOYER_URL
const FILTER_ENDPOINT = env.FILTER_ENDPOINT

const ADDRESS_MANAGER_ADDRESS = env.ADDRESS_MANAGER_ADDRESS
const L2_MESSENGER_ADDRESS = '0x4200000000000000000000000000000000000007'
const OVM_L2_STANDARD_BRIDGE_ADDRESS = '0x4200000000000000000000000000000000000010'
const L1LiquidityPoolAddress = env.PROXY__L1_LIQUIDITY_POOL_ADDRESS
const L2LiquidityPoolAddress = env.PROXY__L2_LIQUIDITY_POOL_ADDRESS

const TRANSACTION_MONITOR_INTERVAL = env.TRANSACTION_MONITOR_INTERVAL || 3 * second
const CROSS_DOMAIN_MESSAGE_MONITOR_INTERVAL = env.CROSS_DOMAIN_MESSAGE_MONITOR_INTERVAL || 3 * second
const STATE_ROOT_MONITOR_INTERVAL = env.STATE_ROOT_MONITOR_INTERVAL || hour
const EXIT_MONITOR_INTERVAL = env.EXIT_MONITOR_INTERVAL || 15 * minute
const L1_BRIDGE_MONITOR_INTERVAL = env.L1_BRIDGE_MONITOR_INTERVAL || 3 * second

const STATE_ROOT_MONITOR_START_BLOCK = env.STATE_ROOT_MONITOR_START_BLOCK || 0
const L1_BRIDGE_MONITOR_START_BLOCK = env.L1_BRIDGE_MONITOR_START_BLOCK || 0

const STATE_ROOT_MONITOR_LOG_INTERVAL = env.STATE_ROOT_MONITOR_LOG_INTERVAL || 2000
const EXIT_MONITOR_LOG_INTERVAL = env.EXIT_MONITOR_LOG_INTERVAL || 2000
const L1_BRIDGE_MONITOR_LOG_INTERVAL = env.L1_BRIDGE_MONITOR_LOG_INTERVAL || 2000

const L1_CROSS_DOMAIN_MESSAGE_WAITING_TIME = env.L1_CROSS_DOMAIN_MESSAGE_WAITING_TIME || 300
const L2_CROSS_DOMAIN_MESSAGE_WAITING_TIME = env.L2_CROSS_DOMAIN_MESSAGE_WAITING_TIME || 3600

const L1_BLOCK_CONFIRMATION = env.L1_BLOCK_CONFIRMATION || 0

const NUMBER_OF_BLOCKS_TO_FETCH = env.NUMBER_OF_BLOCKS_TO_FETCH || 10000000

const LAYER_ZERO_ENABLE_TEST = env.LAYER_ZERO_ENABLE_TEST === 'true' ? true : false
const LAYER_ZERO_CHAIN = env.LAYER_ZERO_CHAIN || 'Testnet'
const LAYER_ZERO_BRIDGES = env.LAYER_ZERO_BRIDGES || ''
const LAYER_ZERO_LATEST_BLOCK = Number(env.LAYER_ZERO_LATEST_BLOCK) || 0

const PERIODIC_TRANSACTION_PRIVATE_KEY = env.PERIODIC_TRANSACTION_PRIVATE_KEY
const PERIODIC_TRANSACTION_INTERVAL = env.PERIODIC_TRANSACTION_INTERVAL || 10 * minute

const BOBASTRAW_CONTACT_ADDRESSES = env.BOBASTRAW_CONTACT_ADDRESSES || ''
const BOBASTRAW_MONITOR_INTERVAL = env.BOBASTRAW_MONITOR_INTERVAL || 10 * minute

const L1_BALANCE_MONITOR_ADDRESSES = env.L1_BALANCE_MONITOR_ADDRESSES || ''
const L2_BALANCE_MONITOR_ADDRESSES = env.L2_BALANCE_MONITOR_ADDRESSES || ''
const BALANCE_MONITOR_INTERVAL = env.BALANCE_MONITOR_INTERVAL || 10 * minute
/* eslint-enable */

class GlobalEnv {
  constructor() {
    /* eslint-disable */
    this.logger = new Logger({ name: this.name })

    this.L1Provider = new ethers.providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
    this.L2Provider = new ethers.providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)

    this.MySQLHostURL = MYSQL_HOST_URL
    this.MySQLPort = MYSQL_PORT
    this.MySQLUsername = MYSQL_USERNAME
    this.MySQLPassword = MYSQL_PASSWORD
    this.MySQLDatabaseName = MYSQL_DATABASE_NAME
    this.MySQLDatabaseNameTx = MYSQL_DBNAME_TX

    this.addressManagerAddress = ADDRESS_MANAGER_ADDRESS
    this.L1CrossDomainMessenger = null
    this.L1CrossDomainMessengerFast = null
    this.OVM_L2CrossDomainMessenger = L2_MESSENGER_ADDRESS
    this.OVM_L2StandardBridge = OVM_L2_STANDARD_BRIDGE_ADDRESS

    this.numberBlockToFetch = NUMBER_OF_BLOCKS_TO_FETCH
    this.transactionMonitorInterval = TRANSACTION_MONITOR_INTERVAL
    this.crossDomainMessageMonitorInterval = CROSS_DOMAIN_MESSAGE_MONITOR_INTERVAL
    this.stateRootMonitorInterval = STATE_ROOT_MONITOR_INTERVAL
    this.exitMonitorInterval = EXIT_MONITOR_INTERVAL
    this.l1BridgeMonitorInterval = L1_BRIDGE_MONITOR_INTERVAL

    this.transactionMonitorSQL = false
    this.crossDomainMessageMonitorSQL = false

    this.StateCommitmentChainContract = null
    this.L1LiquidityPoolContract = null
    this.L2LiquidityPoolContract = null
    this.OVM_L1StandardBridgeContract = null
    this.OVM_L2StandardBridgeContract = null

    this.L1LiquidityPoolInterface = null
    this.OVM_L1StandardBridgeInterface = null

    this.filterEndpoint = FILTER_ENDPOINT

    this.stateRootMonitorStartBlock = STATE_ROOT_MONITOR_START_BLOCK
    this.stateRootMonitorLogInterval = STATE_ROOT_MONITOR_LOG_INTERVAL

    this.exitMonitorLogInterval = EXIT_MONITOR_LOG_INTERVAL

    this.l1BridgeMonitorStartBlock = L1_BRIDGE_MONITOR_START_BLOCK
    this.l1BridgeMonitorLogInterval = L1_BRIDGE_MONITOR_LOG_INTERVAL

    this.l1CrossDomainMessageWaitingTime = L1_CROSS_DOMAIN_MESSAGE_WAITING_TIME
    this.l2CrossDomainMessageWaitingTime = L2_CROSS_DOMAIN_MESSAGE_WAITING_TIME

    this.watcher = null

    this.l1BlockConfirmation = L1_BLOCK_CONFIRMATION

    this.sequencerPublishWindow = 0

    this.layerZeroEnableTest = LAYER_ZERO_ENABLE_TEST
    this.layerZeroChain = LAYER_ZERO_CHAIN
    this.layerZeroBridges = removeBlankStringInArray(LAYER_ZERO_BRIDGES.split(','))
    this.layerZeroLatestBlock = LAYER_ZERO_LATEST_BLOCK

    this.periodicTransactionPK = PERIODIC_TRANSACTION_PRIVATE_KEY
    this.periodicTransactionInterval = PERIODIC_TRANSACTION_INTERVAL

    this.bobaStrawContractAddresses = removeBlankStringInArray(BOBASTRAW_CONTACT_ADDRESSES.split(','))
    this.bobaStrawMonitorInterval = BOBASTRAW_MONITOR_INTERVAL

    this.l1BalanceMonitorAddresses = removeBlankStringInArray(L1_BALANCE_MONITOR_ADDRESSES.split(','))
    this.l2BalanceMonitorAddresses = removeBlankStringInArray(L2_BALANCE_MONITOR_ADDRESSES.split(','))
    this.balanceMonitorInterval = BALANCE_MONITOR_INTERVAL

    this.isAltL1Network = false
    /* eslint-enable */
  }

  async initGlobalEnv() {
    this.isAltL1Network = await isChainIDForGraph(this.L1Provider)

    const addressManager = getContractFactory('Lib_AddressManager')
      .attach(this.addressManagerAddress)
      .connect(this.L1Provider)

    // Get addresses
    this.L1CrossDomainMessenger = await addressManager.getAddress(
      'Proxy__L1CrossDomainMessenger'
    )
    this.L1CrossDomainMessengerFast = await addressManager.getAddress(
      'Proxy__L1CrossDomainMessengerFast'
    )
    this.Proxy__L1StandardBridge = await addressManager.getAddress(
      'Proxy__L1StandardBridge'
    )
    this.StateCommitmentChain = await addressManager.getAddress(
      'StateCommitmentChain'
    )

    this.logger.info(
      'Found L1CrossDomainMessenger, L1CrossDomainMessengerFast and Proxy__L1StandardBridge',
      {
        L1CrossDomainMessenger: this.L1CrossDomainMessenger,
        L1CrossDomainMessengerFast: this.L1CrossDomainMessengerFast,
        Proxy__L1StandardBridge: this.Proxy__L1StandardBridge,
      }
    )

    // Load SCC
    this.StateCommitmentChainContract = getContractFactory(
      'StateCommitmentChain'
    )
      .attach(this.StateCommitmentChain)
      .connect(this.L1Provider)

    this.sequencerPublishWindow = (
      await this.StateCommitmentChainContract.SEQUENCER_PUBLISH_WINDOW()
    ).toNumber()

    // Load L1 Standard Bridge
    this.OVM_L1StandardBridgeContract = getContractFactory(
      this.isAltL1Network ? 'L1StandardBridgeAltL1' : 'L1StandardBridge'
    )
      .attach(this.Proxy__L1StandardBridge)
      .connect(this.L1Provider)

    // Interface
    this.L1LiquidityPoolInterface = new ethers.utils.Interface(
      this.isAltL1Network
        ? await getBobaContractABI('L1LiquidityPoolAltL1')
        : await getBobaContractABI('L1LiquidityPool')
    )
    this.OVM_L1StandardBridgeInterface =
      this.OVM_L1StandardBridgeContract.interface

    if (BOBA_DEPLOYER_URL) {
      const response = await fetch(BOBA_DEPLOYER_URL)
      const addresses = await response.json()

      this.L1LiquidityPoolAddress = addresses.Proxy__L1LiquidityPool
      this.L2LiquidityPoolAddress = addresses.Proxy__L2LiquidityPool
    } else {
      this.L1LiquidityPoolAddress = L1LiquidityPoolAddress
      this.L2LiquidityPoolAddress = L2LiquidityPoolAddress
    }
    this.logger.info('Found L1LiquidityPool and L2LiquidityPool', {
      L1LiquidityPoolAddress: this.L1LiquidityPoolAddress,
      L2LiquidityPoolAddress: this.L2LiquidityPoolAddress,
    })
    // Load L1 LP
    this.L1LiquidityPoolContract = await getBobaContractAt(
      this.isAltL1Network ? 'L1LiquidityPoolAltL1' : 'L1LiquidityPool',
      this.L1LiquidityPoolAddress,
      this.L1Provider
    )
    // Load L2 LP
    this.L2LiquidityPoolContract = await getBobaContractAt(
      this.isAltL1Network ? 'L2LiquidityPoolAltL1' : 'L2LiquidityPool',
      this.L2LiquidityPoolAddress,
      this.L2Provider
    )
    // Load L2 Standard Bridge
    this.OVM_L2StandardBridgeContract = getContractFactory(
      this.isAltL1Network ? 'L2StandardBridgeAltL1' : 'L2StandardBridge'
    )
      .attach(this.OVM_L2StandardBridge)
      .connect(this.L2Provider)

    // watcher
    const { chainId } = await this.L1Provider.getNetwork()
    this.watcher = new CrossChainMessenger({
      l1SignerOrProvider: this.L1Provider,
      l2SignerOrProvider: this.L2Provider,
      l1ChainId: chainId,
      fastRelayer: false,
    })

    this.logger.info(
      `Set up for ${this.isAltL1Network ? 'Alt' : 'Ethereum'} L2`
    )
  }
}

module.exports = GlobalEnv
