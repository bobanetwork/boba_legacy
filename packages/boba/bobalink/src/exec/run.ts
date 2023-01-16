import { Wallet, providers } from 'ethers'
import { Bcfg } from '@eth-optimism/core-utils'
import * as dotenv from 'dotenv'
import Config from 'bcfg'

/* Imports: Core */
import { BobaLinkService } from '../service'

/* Imports: Config */
import { BobaLinkPairs } from '../utils/chains'

dotenv.config()

const main = async () => {
  const config: Bcfg = new Config('boba-link')
  config.load({
    env: true,
    argv: true,
  })

  const env = process.env
  const L1_NODE_WEB3_URL = config.str('l1-node-web3-url', env.L1_NODE_WEB3_URL)
  const L2_NODE_WEB3_URL = config.str('l2-node-web3-url', env.L2_NODE_WEB3_URL)

  const BOBALINK_REPORTER_KEY = config.str(
    'bobalink-reporter-key',
    env.BOBALINK_REPORTER_KEY
  )
  // Optional
  const POLLING_INTERVAL = config.uint(
    'polling-interval',
    parseInt(env.POLLING_INTERVAL, 10) || 1000 * 12
  )
  const SET_GAS_PRICE_TO_ZERO = config.bool(
    'set-gas-price-to-zero',
    env.SET_GAS_PRICE_TO_ZERO === 'true'
  )

  if (!L1_NODE_WEB3_URL) {
    throw new Error('Must pass L1_NODE_WEB3_URL')
  }
  if (!L2_NODE_WEB3_URL) {
    throw new Error('Must pass L2_NODE_WEB3_URL')
  }
  if (!BOBALINK_REPORTER_KEY) {
    throw new Error('Must pass BOBALINK_REPORTER_KEY')
  }

  const l1Provider = new providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
  const l2Provider = new providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)
  const reporterWallet = new Wallet(BOBALINK_REPORTER_KEY, l2Provider)

  const chainId = (await l2Provider.getNetwork()).chainId

  const service = new BobaLinkService({
    l1RpcProvider: l1Provider,
    l2RpcProvider: l2Provider,
    chainId,
    reporterWallet,
    bobaLinkPairs: BobaLinkPairs[chainId],
    pollingInterval: POLLING_INTERVAL,
    setGasPriceToZero: SET_GAS_PRICE_TO_ZERO,
  })

  await service.start()
}

export default main
