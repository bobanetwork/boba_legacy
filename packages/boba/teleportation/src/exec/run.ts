import { Wallet, providers } from 'ethers'
import { Bcfg } from '@eth-optimism/core-utils'
import * as dotenv from 'dotenv'
import Config from 'bcfg'

/* Imports: Core */
import { TeleportationService } from '../service'

/* Imports: Config */
import { BobaChains } from '../utils/chains'

/* Imports: Interface */
import { ChainInfo, SupportedAssets } from '../utils/types'
import { AppDataSource } from '../data-source'
import { HistoryData } from '../entities/HistoryData.entity'
import { Init1687802800701 } from '../migrations/1687802800701-00_Init'
import {LastAirdrop} from "../entities/LastAirdrop.entity";
import {LastAirdrop1687802800701} from "../migrations/1687802800701-01_LastAirdrop";

dotenv.config()

const main = async () => {
  if (!AppDataSource.isInitialized) {
    AppDataSource.setOptions({
      migrationsRun: true,
      logging: false,
      synchronize: false,
      entities: [HistoryData, LastAirdrop],
      migrations: [Init1687802800701, LastAirdrop1687802800701],
    })
    await AppDataSource.initialize() // initialize DB connection
  }
  console.log('Database initialized: ', AppDataSource.isInitialized)

  const config: Bcfg = new Config('teleportation')
  config.load({
    env: true,
    argv: true,
  })

  const env = process.env
  const L2_NODE_WEB3_URL = config.str('l2-node-web3-url', env.L2_NODE_WEB3_URL)
  // This private key is used to send funds to the contract and initiate the tx,
  // so it should have enough BOBA balance
  const TELEPORTATION_AWS_KMS_ACCESS_KEY = config.str(
    'teleportation-aws-kms-access-key',
    env.TELEPORTATION_AWS_KMS_ACCESS_KEY
  )
  const TELEPORTATION_AWS_KMS_SECRET_KEY = config.str(
    'teleportation-aws-kms-secret-key',
    env.TELEPORTATION_AWS_KMS_SECRET_KEY
  )
  const TELEPORTATION_AWS_KMS_KEY_ID = config.str(
    'teleportation-aws-kms-key-id',
    env.TELEPORTATION_AWS_KMS_KEY_ID
  )
  const TELEPORTATION_AWS_KMS_REGION = config.str(
    'teleportation-aws-kms-region',
    env.TELEPORTATION_AWS_KMS_REGION
  )
  const TELEPORTATION_AWS_KMS_ENDPOINT = config.str(
    'teleportation-aws-kms-endpoint',
    env.TELEPORTATION_AWS_KMS_ENDPOINT
  )
  const TELEPORTATION_AIRDROP_GAS_AMOUNT_WEI = config.str(
    'teleportation-airdrop-gas-amount-wei',
    env.TELEPORTATION_AIRDROP_GAS_AMOUNT_WEI || '100000000000000' // 0.0001 eth
  )
  const TELEPORTATION_AIRDROP_MIN_USD_VALUE = config.str(
    'teleportation-airdrop-min-usd-value',
    env.TELEPORTATION_AIRDROP_MIN_USD_VALUE || '15'
  )
  const TELEPORTATION_AIRDROP_COOLDOWN_SECONDS = config.str(
    'teleportation-airdrop-cooldown-seconds',
    env.TELEPORTATION_AIRDROP_COOLDOWN_SECONDS || '86400'
  )
  const TELEPORTATION_AIRDROP_ENABLED = config.bool(
    'teleportation-airdrop-enabled',
    env.TELEPORTATION_AIRDROP_ENABLED.toLowerCase() === "true" || false
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
  if (
    !TELEPORTATION_AWS_KMS_ACCESS_KEY ||
    !TELEPORTATION_AWS_KMS_SECRET_KEY ||
    !TELEPORTATION_AWS_KMS_KEY_ID ||
    !TELEPORTATION_AWS_KMS_ENDPOINT ||
    !TELEPORTATION_AWS_KMS_REGION
  ) {
    throw new Error('Must pass TELEPORTATION AWS CONFIG ENV')
  }

  const l2Provider = new providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)

  // get all boba chains and exclude the current chain
  const chainId = (await l2Provider.getNetwork()).chainId
  const isTestnet = BobaChains[chainId].testnet
  let originSupportedAssets: SupportedAssets
  const selectedBobaChains: ChainInfo[] = Object.keys(BobaChains).reduce(
    (acc, cur) => {
      const chain = BobaChains[cur]
      if (isTestnet === chain.testnet) {
        if (Number(cur) !== chainId) {
          chain.provider = new providers.StaticJsonRpcProvider(chain.url)
          acc.push({ chainId: cur, ...chain })
        } else {
          originSupportedAssets = chain.supportedAssets
        }
      }
      return acc
    },
    []
  )
  const TELEPORTATION_ADDRESS = BobaChains[chainId].teleportationAddress

  const service = new TeleportationService({
    l2RpcProvider: l2Provider,
    chainId,
    teleportationAddress: TELEPORTATION_ADDRESS,
    selectedBobaChains,
    ownSupportedAssets: originSupportedAssets,
    pollingInterval: POLLING_INTERVAL,
    blockRangePerPolling: BLOCK_RANGE_PER_POLLING,
    awsConfig: {
      awsKmsAccessKey: TELEPORTATION_AWS_KMS_ACCESS_KEY,
      awsKmsSecretKey: TELEPORTATION_AWS_KMS_SECRET_KEY,
      awsKmsKeyId: TELEPORTATION_AWS_KMS_KEY_ID,
      awsKmsRegion: TELEPORTATION_AWS_KMS_REGION,
      awsKmsEndpoint: TELEPORTATION_AWS_KMS_ENDPOINT
    },
    airdropConfig: {
      airdropAmountWei: TELEPORTATION_AIRDROP_GAS_AMOUNT_WEI,
      airdropMinUsdValue: TELEPORTATION_AIRDROP_MIN_USD_VALUE,
      airdropCooldownSeconds: TELEPORTATION_AIRDROP_COOLDOWN_SECONDS,
      airdropEnabled: TELEPORTATION_AIRDROP_ENABLED,
    }
  })

  await service.start()
}

if (require.main === module) {
  main()
}

export default main
