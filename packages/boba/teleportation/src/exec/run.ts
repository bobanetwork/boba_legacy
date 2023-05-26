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
import { AppDataSource } from '../data-source'

dotenv.config()

const main = async () => {
  await AppDataSource.initialize() // initialize DB connection

  const config: Bcfg = new Config('teleportation')
  config.load({
    env: true,
    argv: true,
  })

  const env = process.env
  const L2_NODE_WEB3_URL = config.str('l2-node-web3-url', env.L2_NODE_WEB3_URL)
  // This private key is used to send funds to the contract and initiate the tx,
  // so it should have enough BOBA balance
  const TELEPORTATION_DISBURSER_KEY = config.str(
    'teleportation-disburser-key',
    env.TELEPORTATION_DISBURSER_KEY
  )

  // Optional
  const POLLING_INTERVAL = config.uint(
    'polling-interval',
    parseInt(env.TELEPORTATION_POLLING_INTERVAL, 10) || 1000 * 60
  )
  const BLOCK_RANGE_PER_POLLING = config.uint(
    'block-range-per-polling',
    parseInt(env.TELEPORTATION_BLOCK_RANGE_PER_POLLING, 10) || 1000
  )

  if (!L2_NODE_WEB3_URL) {
    throw new Error('Must pass L2_NODE_WEB3_URL')
  }
  if (!TELEPORTATION_DISBURSER_KEY) {
    throw new Error('Must pass TELEPORTATION_DISBURSER_KEY')
  }

  const l2Provider = new providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)
  const disburserWallet = new Wallet(TELEPORTATION_DISBURSER_KEY, l2Provider)

  // get all boba chains and exclude the current chain
  const chainId = (await l2Provider.getNetwork()).chainId
  const isTestnet = BobaChains[chainId].testnet
  const selectedBobaChains: ChainInfo[] = Object.keys(BobaChains).reduce(
    (acc, cur) => {
      const chain = BobaChains[cur]
      if (isTestnet === chain.testnet && Number(cur) !== chainId) {
        chain.provider = new providers.StaticJsonRpcProvider(chain.url)
        acc.push({ chainId: cur, ...chain })
      }
      return acc
    },
    []
  )
  const BOBA_TOKEN_ADDRESS = BobaChains[chainId].BobaTokenAddress
  const TELEPORTATION_ADDRESS = BobaChains[chainId].teleportationAddress

  const service = new TeleportationService({
    l2RpcProvider: l2Provider,
    chainId,
    teleportationAddress: TELEPORTATION_ADDRESS,
    bobaTokenAddress: BOBA_TOKEN_ADDRESS,
    disburserWallet,
    selectedBobaChains,
    pollingInterval: POLLING_INTERVAL,
    blockRangePerPolling: BLOCK_RANGE_PER_POLLING,
  })

  await service.start()
}

if (require.main === module) {
  main()
}

export default main
