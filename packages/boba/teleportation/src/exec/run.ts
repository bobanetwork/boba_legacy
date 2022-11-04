import { Wallet, providers } from 'ethers'
import { Bcfg } from '@eth-optimism/core-utils'
import * as dotenv from 'dotenv'
import Config from 'bcfg'

/* Imports: Core */
import { TeleportationService } from '../service'

/* Imports: Config */
import { BobaChains } from '../utils/chains'

/* Imports: Interface */
import { ChainInfo } from '../utils/types'

dotenv.config()

const main = async () => {
  const config: Bcfg = new Config('gas-price-oracle')
  config.load({
    env: true,
    argv: true,
  })

  const env = process.env
  const L2_NODE_WEB3_URL = config.str('l2-node-web3-url', env.L2_NODE_WEB3_URL)
  const TELEPORTATION_ADDRESS = config.str(
    'teleportation-address',
    env.TELEPORTATION_ADDRESS
  )
  // This private key is used to send funds to the contract and initiate the tx,
  // so it should have enough BOBA balance
  const TELEPORTATION_DISBURSER_KEY = config.str(
    'teleportation-disburser-key',
    env.TELEPORTATION_DISBURSER_KEY
  )

  const POLLING_INTERVAL = config.uint(
    'polling-interval',
    parseInt(env.POLLING_INTERVAL, 10) || 1000 * 60
  )
  const EVENT_PER_POLLING_INTERVAL = config.uint(
    'event-per-polling-interval',
    parseInt(env.EVENT_PER_POLLING_INTERVAL, 10) || 1000
  )
  const IS_MAINNET = config.bool(
    'is-mainnet',
    env.IS_MAINNET === 'true' || false
  )
  const DATABASE_PATH = config.str('database-path', env.DATABASE_PATH || './db')

  if (!L2_NODE_WEB3_URL) {
    throw new Error('Must pass L2_NODE_WEB3_URL')
  }
  if (!TELEPORTATION_ADDRESS) {
    throw new Error('Must pass TELEPORTATION_ADDRESS')
  }
  if (!TELEPORTATION_DISBURSER_KEY) {
    throw new Error('Must pass TELEPORTATION_DISBURSER_KEY')
  }
  if (EVENT_PER_POLLING_INTERVAL === 0) {
    console.warn('TELEPORTATION_BLOCK_HEIGHT is 0')
  }

  const l2Provider = new providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)
  const disburserWallet = new Wallet(TELEPORTATION_DISBURSER_KEY, l2Provider)

  // get all boba chains and exclude the current chain
  console.log(`Looking for ${IS_MAINNET ? 'mainnet' : 'testnet'}`)
  const chainId = (await l2Provider.getNetwork()).chainId
  const selectedBobaChains: ChainInfo[] = Object.keys(BobaChains).reduce(
    (acc, cur) => {
      const chain = BobaChains[cur]
      if (chain.isMainnet === !chain.testnet && chain.chainId !== chainId) {
        acc.push({ chainId: cur, ...chain })
      }
      return acc
    },
    []
  )

  const service = new TeleportationService({
    l2RpcProvider: l2Provider,
    chainId,
    teleportationAddress: TELEPORTATION_ADDRESS,
    disburserWallet,
    selectedBobaChains,
    pollingInterval: POLLING_INTERVAL,
    eventPerPollingInterval: EVENT_PER_POLLING_INTERVAL,
    dbPath: DATABASE_PATH,
  })

  await service.start()
}
export default main
