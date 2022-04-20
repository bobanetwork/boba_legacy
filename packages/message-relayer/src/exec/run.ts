import { Wallet, providers } from 'ethers'
import { Bcfg } from '@eth-optimism/core-utils'
import { Logger, LoggerOptions } from '@eth-optimism/common-ts'
import * as Sentry from '@sentry/node'
import * as dotenv from 'dotenv'
import Config from 'bcfg'

import { MessageRelayerService } from '../service'

dotenv.config()

const main = async () => {
  const config: Bcfg = new Config('message-relayer')
  config.load({
    env: true,
    argv: true,
  })

  const env = process.env

  const SENTRY_DSN = config.str('sentry-dsn', env.SENTRY_DSN)
  const USE_SENTRY = config.bool('use-sentry', env.USE_SENTRY === 'true')
  const ETH_NETWORK_NAME = config.str('eth-network-name', env.ETH_NETWORK_NAME)

  const loggerOptions: LoggerOptions = {
    name: 'Message_Relayer',
  }

  if (USE_SENTRY) {
    const sentryOptions = {
      release: `message-relayer@${process.env.npm_package_version}`,
      dsn: SENTRY_DSN,
      environment: ETH_NETWORK_NAME,
    }
    loggerOptions.sentryOptions = sentryOptions
    Sentry.init(sentryOptions)
  }

  const logger = new Logger(loggerOptions)

  const L2_NODE_WEB3_URL = config.str('l2-node-web3-url', env.L2_NODE_WEB3_URL)
  const L1_NODE_WEB3_URL = config.str('l1-node-web3-url', env.L1_NODE_WEB3_URL)
  let RELAYER_PRIVATE_KEY = config.str('l1-wallet-key', env.RELAYER_PRIVATE_KEY)
  const MNEMONIC = config.str('mnemonic', env.MNEMONIC)
  const HD_PATH = config.str('hd-path', env.HD_PATH)

  // run as message relayer fast
  const FAST_RELAYER = config.bool('fast-relayer', env.FAST_RELAYER === 'true')
  // check if FAST_RELAYER_PRIVATE_KEY is passed
  const FAST_RELAYER_PRIVATE_KEY = config.str(
    'l1-wallet-key-fast',
    env.FAST_RELAYER_PRIVATE_KEY
  )
  // if this exists and is fast-relayer mode, use this account
  if (FAST_RELAYER_PRIVATE_KEY && FAST_RELAYER) {
    RELAYER_PRIVATE_KEY = FAST_RELAYER_PRIVATE_KEY
  }
  //batch system
  const MIN_BATCH_SIZE = config.uint(
    'min-batch-size',
    parseInt(env.MIN_BATCH_SIZE, 10) || 2
  )
  const MAX_WAIT_TIME_S = config.uint(
    'max-wait-time-s',
    parseInt(env.MAX_WAIT_TIME_S, 10) || 60
  )
  const MAX_WAIT_TX_TIME_S = config.uint(
    'max-wait-tx-time-s',
    parseInt(env.MAX_WAIT_TX_TIME_S, 10) || 180
  )
  const RELAY_GAS_LIMIT = config.uint(
    'relay-gas-limit',
    parseInt(env.RELAY_GAS_LIMIT, 10) || 4000000
  )
  const POLLING_INTERVAL = config.uint(
    'polling-interval',
    parseInt(env.POLLING_INTERVAL, 10) || 5000
  )
  const GET_LOGS_INTERVAL = config.uint(
    'get-logs-interval',
    parseInt(env.GET_LOGS_INTERVAL, 10) || 2000
  )
  const L1_START_OFFSET = config.uint(
    'l1-start-offset',
    parseInt(env.L1_BLOCK_OFFSET, 10) || 1
  )
  const FROM_L2_TRANSACTION_INDEX = config.uint(
    'from-l2-transaction-index',
    parseInt(env.FROM_L2_TRANSACTION_INDEX, 10) || 0
  )
  const FILTER_ENDPOINT =
    config.str('filter-endpoint', env.FILTER_ENDPOINT) || ''
  const FILTER_POLLING_INTERVAL = config.uint(
    'filter-polling-interval',
    parseInt(env.FILTER_POLLING_INTERVAL, 10) || 60000
  )
  const MAX_GAS_PRICE_IN_GWEI = config.uint(
    'max-gas-price-in-gwei',
    parseInt(env.MAX_GAS_PRICE_IN_GWEI, 10) || 100
  )
  const GAS_RETRY_INCREMENT = config.uint(
    'gas-retry-increment',
    parseInt(env.GAS_RETRY_INCREMENT, 10) || 5
  )
  const NUM_CONFIRMATIONS = config.uint(
    'num-confirmations',
    parseInt(env.NUM_CONFIRMATIONS, 10) || 1
  )
  const MULTI_RELAY_LIMIT = config.uint(
    'multi-relay-limit',
    parseInt(env.MULTI_RELAY_LIMIT, 10) || 10
  )
  const RESUBMISSION_TIMEOUT = config.uint(
    'resubmission-timeout',
    parseInt(env.RESUBMISSION_TIMEOUT, 10) || 60
  )

  if (!L1_NODE_WEB3_URL) {
    throw new Error('Must pass L1_NODE_WEB3_URL')
  }
  if (!L2_NODE_WEB3_URL) {
    throw new Error('Must pass L2_NODE_WEB3_URL')
  }

  const l2Provider = new providers.StaticJsonRpcProvider({
    url: L2_NODE_WEB3_URL,
    headers: { 'User-Agent': 'message-relayer' },
  })
  const l1Provider = new providers.StaticJsonRpcProvider({
    url: L1_NODE_WEB3_URL,
    headers: { 'User-Agent': 'message-relayer' },
  })

  let wallet: Wallet
  if (RELAYER_PRIVATE_KEY) {
    wallet = new Wallet(RELAYER_PRIVATE_KEY, l1Provider)
  } else if (MNEMONIC) {
    wallet = Wallet.fromMnemonic(MNEMONIC, HD_PATH)
    wallet = wallet.connect(l1Provider)
  } else {
    throw new Error('Must pass one of RELAYER_PRIVATE_KEY or MNEMONIC')
  }

  const service = new MessageRelayerService({
    l2RpcProvider: l2Provider,
    l1Wallet: wallet,
    relayGasLimit: RELAY_GAS_LIMIT,
    //batch system
    minBatchSize: MIN_BATCH_SIZE,
    maxWaitTimeS: MAX_WAIT_TIME_S,
    maxWaitTxTimeS: MAX_WAIT_TX_TIME_S,
    fromL2TransactionIndex: FROM_L2_TRANSACTION_INDEX,
    pollingInterval: POLLING_INTERVAL,
    l1StartOffset: L1_START_OFFSET,
    getLogsInterval: GET_LOGS_INTERVAL,
    logger,
    filterEndpoint: FILTER_ENDPOINT,
    filterPollingInterval: FILTER_POLLING_INTERVAL,
    // gas price
    maxGasPriceInGwei: MAX_GAS_PRICE_IN_GWEI,
    gasRetryIncrement: GAS_RETRY_INCREMENT,
    numConfirmations: NUM_CONFIRMATIONS,
    multiRelayLimit: MULTI_RELAY_LIMIT,
    resubmissionTimeout: RESUBMISSION_TIMEOUT * 1000,
    isFastRelayer: FAST_RELAYER,
  })

  await service.start()
}

export default main
