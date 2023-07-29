import { addMonths, Now, addYear, Dayjs } from 'util/dates'

/**************
 * Env Params *
 **************/
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

type EnvType = string | number | null | undefined

export const POLL_INTERVAL: EnvType =
  process.env.REACT_APP_POLL_INTERVAL || 20000
export const GAS_POLL_INTERVAL: EnvType =
  process.env.REACT_APP_GAS_POLL_INTERVAL || 40000
export const GA4_MEASUREMENT_ID: EnvType =
  process.env.REACT_APP_GA4_MEASUREMENT_ID || null
export const APP_ENV: EnvType = process.env.REACT_APP_ENV || 'dev'
export const SENTRY_DSN: EnvType = process.env.REACT_APP_SENTRY_DSN || null
export const INFURA_ID: EnvType = process.env.REACT_APP_INFURA_ID
export const MAX_HEALTH_BLOCK_LAG: EnvType =
  process.env.REACT_APP_MAX_HEALTH_BLOCK_LAG
export const WALLET_VERSION: EnvType = process.env.REACT_APP_WALLET_VERSION
export const SPEED_CHECK: EnvType = process.env.REACT_APP_SPEED_CHECK
export const TARGET_CHAIN_URL: EnvType = process.env.REACT_APP_TARGET_CHAIN_URL
// VE DAO FLAG
export const DISABLE_VE_DAO: EnvType = process.env.REACT_APP_DISABLE_VE_DAO
// WalletConnect FLAG
export const DISABLE_WALLETCONNECT: EnvType =
  process.env.REACT_APP_DISABLE_WALLETCONNECT

type BridgeType = {
  FAST_BRIDGE: string
  CLASSIC_BRIDGE: string
  MULTI_BRIDGE: string
  MULTI_CHAIN_BRIDGE: string
}

export const BRIDGE_TYPE: BridgeType = {
  FAST_BRIDGE: 'FAST_BRIDGE',
  CLASSIC_BRIDGE: 'CLASSIC_BRIDGE',
  MULTI_BRIDGE: 'MULTI_BRIDGE', //fix me remove me
  MULTI_CHAIN_BRIDGE: 'MULTI_CHAIN_BRIDGE',
}

type ExpiryOptionType = {
  value: string | Dayjs
  label: string
}

export const EXPIRY_OPTIONS: ExpiryOptionType[] = [
  {
    value: addMonths(Now(), 3, 'YYYY-MM-DD'),
    label: '3 Months',
  },
  {
    value: addMonths(Now(), 7, 'YYYY-MM-DD'),
    label: '6 Months',
  },
  {
    value: addYear(1, 'YYYY-MM-DD'),
    label: '1 Year',
  },
]

/*********************
 * Routes Constants **
 *********************/

type RoutesPathType = {
  BRIDGE: string
  HISTORY: string
  EARN: string
  LOCK: string
  STAKE: string
  HELP: string
  BOBASCOPE: string
  VOTE_DAO: string
  DAO: string
  DEV_TOOLS: string
}

export const ROUTES_PATH: RoutesPathType = {
  BRIDGE: '/bridge',
  HISTORY: '/history',
  EARN: '/earn',
  LOCK: '/lock',
  STAKE: '/stake',
  HELP: '/help',
  BOBASCOPE: '/bobascope',
  VOTE_DAO: '/votedao',
  DAO: '/DAO',
  DEV_TOOLS: '/devtools',
}

export const PER_PAGE: number = 8

type Network = 'ethereum' | 'bnb' | 'avax' //we move this to global network type once we define this
type Page =
  | 'Bridge'
  | 'Wallet'
  | 'History'
  | 'Earn'
  | 'Stake'
  | 'DAO'
  | 'Monster'
type PagesByNetworkType = Record<Network, Page[]>

export const PAGES_BY_NETWORK: PagesByNetworkType = {
  ethereum: ['Bridge', 'Wallet', 'History', 'Earn', 'Stake', 'DAO'],
  bnb: ['Bridge', 'Wallet', 'Earn', 'History'],
  avax: ['Bridge', 'Wallet', 'Earn', 'History'],
}

export enum Layer {
  L1 = 'L1',
  L2 = 'L2',
}
export const LAYER: { [key: string]: Layer } = Layer

type NetworkIconType = 'ethereum' | 'boba'

type NetworkNameType = {
  L1: string
  L2: string
}

type DefaultNetworkType = {
  NAME: NetworkNameType
  ICON: Record<Layer, NetworkIconType>
}

export const DEFAULT_NETWORK: DefaultNetworkType = {
  NAME: {
    L1: 'Ethereum',
    L2: 'Boba',
  },
  ICON: {
    L1: 'ethereum',
    L2: 'boba',
  },
}

export const MM_EXTENTION_URL: string =
  'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en'

export const MIN_NATIVE_L1_BALANCE: number = 0.002

export const BANXA_URL: string = 'https://boba.banxa.com/?'
