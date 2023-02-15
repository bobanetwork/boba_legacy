import { Wallet, providers } from 'ethers'
import { Bcfg } from '@eth-optimism/core-utils'
import { predeploys } from '@eth-optimism/contracts'
import * as dotenv from 'dotenv'
import Config from 'bcfg'

import { GasPriceOracleService, GasPriceOracleAltL1Service } from '../service'

dotenv.config()

const main = async () => {
  const config: Bcfg = new Config('gas-price-oracle')
  config.load({
    env: true,
    argv: true,
  })

  const env = process.env
  const L2_NODE_WEB3_URL = config.str('l2-node-web3-url', env.L2_NODE_WEB3_URL)
  const L1_NODE_WEB3_URL = config.str('l1-node-web3-url', env.L1_NODE_WEB3_URL)

  const GAS_PRICE_ORACLE_OWNER_PRIVATE_KEY = config.str(
    'gas-price-oracle-owner-key',
    env.GAS_PRICE_ORACLE_OWNER_PRIVATE_KEY
  )
  const SEQUENCER_ADDRESS = config.str(
    'sequencer-address',
    env.SEQUENCER_ADDRESS
  )
  const PROPOSER_ADDRESS = config.str('proposer-address', env.PROPOSER_ADDRESS)
  const RELAYER_PRIVATE_KEY = config.str(
    'relayer-private-key',
    env.RELAYER_PRIVATE_KEY
  )
  const RELAYER_ADDRESS = config.str('relayer-address', env.RELAYER_ADDRESS)
  const FAST_RELAYER_PRIVATE_KEY = config.str(
    'fast-relayer-private-key',
    env.FAST_RELAYER_PRIVATE_KEY
  )
  const FAST_RELAYER_ADDRESS = config.str(
    'fast-relayer-address',
    env.FAST_RELAYER_ADDRESS
  )

  const GAS_PRICE_ORACLE_ADDRESS = config.str(
    'gas-price-oracle',
    env.GAS_PRICE_ORACLE_ADDRESS
  )

  const POLLING_INTERVAL = config.uint(
    'polling-interval',
    parseInt(env.POLLING_INTERVAL, 10) || 1000 * 60 * 5
  )

  const ADDRESS_MANAGER_ADDRESS = config.str(
    'address-manager-address',
    env.ADDRESS_MANAGER_ADDRESS
  )
  // OVERHEAD_RATIO_1000X / 1000 = ratio
  const OVERHEAD_RATIO_1000X = config.uint(
    'overhead-ration-1000x',
    parseInt(env.OVERHEAD_RATIO_1000X, 10) || 10
  )
  const OVERHEAD_MIN_PERCENT_CHANGE = config.uint(
    'overhead-min-percent-change',
    parseFloat(env.OVERHEAD_MIN_PERCENT_CHANGE) || 0.05
  )
  const MIN_OVERHEAD = config.uint(
    'min-overhead',
    parseInt(env.MIN_OVERHEAD, 10) || 30000
  )

  // minimum l1 base fee
  const MIN_L1_BASE_FEE = config.uint(
    'min-l1-base-fee',
    parseInt(env.MIN_L1_BASE_FEE, 10) || 150000000000
  )
  // max l1 base fee
  const MAX_L1_BASE_FEE = config.uint(
    'max-l1-base-fee',
    parseInt(env.MAX_L1_BASE_FEE, 10) || 225000000000
  )

  // boba gas fee / eth gas fee = BOBA_AS_FEE_TOKEN_RATIO_100X
  const BOBA_FEE_RATIO_100X = config.uint(
    'boba-fee-ratio-100x',
    parseInt(env.BOBA_FEE_RATIO_100X, 10) || 85
  )

  // disable gasPrice=0 for local testing
  const BOBA_LOCAL_TESTNET_CHAINID = config.uint(
    'boba-local-testnet-chainid',
    parseInt(env.BOBA_LOCAL_TESTNET_CHAINID, 10) || 31338
  )

  // Data provided by CoinGecko
  // Coin ID in CoinGecko
  const L1_TOKEN_COINGECKO_ID = config.str(
    'l1-token-coingecko-id',
    env.L1_TOKEN_COINGECKO_ID
  )

  // Data provide by Coinmarketcap
  // Coin ID in Coinmarketcap
  const L1_TOKEN_COINMARKETCAP_ID = config.str(
    'l1-token-coinmarketcap-id',
    env.L1_TOKEN_COINMARKETCAP_ID
  )

  // API key for Coinmarketcap
  const COINMARKETCAP_API_KEY = config.str(
    'coinmarketcap-api-key',
    env.COINMARKETCAP_API_KEY
  )

  if (!GAS_PRICE_ORACLE_ADDRESS) {
    throw new Error('Must pass GAS_PRICE_ORACLE_ADDRESS')
  }
  if (!L1_NODE_WEB3_URL) {
    throw new Error('Must pass L1_NODE_WEB3_URL')
  }
  if (!L2_NODE_WEB3_URL) {
    throw new Error('Must pass L2_NODE_WEB3_URL')
  }
  if (!GAS_PRICE_ORACLE_OWNER_PRIVATE_KEY) {
    throw new Error('Must pass GAS_PRICE_ORACLE_OWNER_PRIVATE_KEY')
  }
  if (!SEQUENCER_ADDRESS) {
    throw new Error('Must pass SEQUENCER_ADDRESS')
  }
  if (!PROPOSER_ADDRESS) {
    throw new Error('Must pass PROPOSER_ADDRESS')
  }
  if (!RELAYER_ADDRESS && !RELAYER_PRIVATE_KEY) {
    throw new Error('Must pass RELAYER_ADDRESS or RELAYER_PRIVATE_KEY')
  }
  if (!FAST_RELAYER_ADDRESS && !FAST_RELAYER_PRIVATE_KEY) {
    throw new Error(
      'Must pass FAST_RELAYER_ADDRESS or FAST_RELAYER_PRIVATE_KEY'
    )
  }

  const l1Provider = new providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
  const l2Provider = new providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)

  const gasPriceOracleOwnerWallet = new Wallet(
    GAS_PRICE_ORACLE_OWNER_PRIVATE_KEY,
    l2Provider
  )

  // Fixed address
  const OVM_SequencerFeeVault = '0x4200000000000000000000000000000000000011'

  // sequencer, proposer, relayer and fast relayer addresses
  const sequencerAddress = SEQUENCER_ADDRESS
  const proposerAddress = PROPOSER_ADDRESS
  const relayerAddress = RELAYER_ADDRESS
    ? RELAYER_ADDRESS
    : new Wallet(RELAYER_PRIVATE_KEY, l2Provider).address
  const fastRelayerAddress = FAST_RELAYER_ADDRESS
    ? FAST_RELAYER_ADDRESS
    : new Wallet(FAST_RELAYER_PRIVATE_KEY, l2Provider).address

  const params = {
    l1RpcProvider: l1Provider,
    l2RpcProvider: l2Provider,
    addressManagerAddress: ADDRESS_MANAGER_ADDRESS,
    gasPriceOracleAddress: GAS_PRICE_ORACLE_ADDRESS,
    OVM_SequencerFeeVault,
    gasPriceOracleOwnerWallet,
    sequencerAddress,
    proposerAddress,
    relayerAddress,
    fastRelayerAddress,
    pollingInterval: POLLING_INTERVAL,
    overheadRatio1000X: OVERHEAD_RATIO_1000X,
    overheadMinPercentChange: OVERHEAD_MIN_PERCENT_CHANGE,
    minOverhead: MIN_OVERHEAD,
    minL1BaseFee: MIN_L1_BASE_FEE,
    maxL1BaseFee: MAX_L1_BASE_FEE,
    bobaFeeRatio100X: BOBA_FEE_RATIO_100X,
    bobaLocalTestnetChainId: BOBA_LOCAL_TESTNET_CHAINID,
    l1TokenCoinGeckoId: L1_TOKEN_COINGECKO_ID,
    l1TokenCoinMarketCapId: L1_TOKEN_COINMARKETCAP_ID,
    coinMarketCapApiKey: COINMARKETCAP_API_KEY,
    l2_L1NativeTokenAddress: predeploys.L2_L1NativeToken_ALT_L1,
  }

  const service = new GasPriceOracleService(params)
  const serviceAltL1 = new GasPriceOracleAltL1Service(params)

  const l1ChainId = (await l1Provider.getNetwork()).chainId
  if (l1ChainId === 1 || l1ChainId === 5) {
    await service.start()
  } else {
    await serviceAltL1.start()
  }
}

if (require.main === module) {
  main()
}

export default main
