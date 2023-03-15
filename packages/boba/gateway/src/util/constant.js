import moment from 'moment'


/**************
 * Env Params *
 **************/
require('dotenv').config()

export const POLL_INTERVAL = process.env.REACT_APP_POLL_INTERVAL || 20000
export const GAS_POLL_INTERVAL = process.env.REACT_APP_GAS_POLL_INTERVAL || 40000
export const GA4_MEASUREMENT_ID = process.env.REACT_APP_GA4_MEASUREMENT_ID || null
export const APP_ENV = process.env.REACT_APP_ENV || 'dev'
export const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || null
export const INFURA_ID = process.env.REACT_APP_INFURA_ID
export const MAX_HEALTH_BLOCK_LAG = process.env.REACT_APP_MAX_HEALTH_BLOCK_LAG
export const WALLET_VERSION = process.env.REACT_APP_WALLET_VERSION
export const APP_STATUS = process.env.REACT_APP_STATUS || 'normal'
export const SPEED_CHECK = process.env.REACT_APP_SPEED_CHECK
export const TARGET_CHAIN_URL = process.env.REACT_APP_TARGET_CHAIN_URL
// VE DAO FLAG
export const DISABLE_VE_DAO = process.env.REACT_APP_DISABLE_VE_DAO
// WalletConnect FLAG
export const DISABLE_WALLETCONNECT = process.env.REACT_APP_DISABLE_WALLETCONNECT

export const BRIDGE_TYPE = {
  FAST_BRIDGE: "FAST_BRIDGE",
  CLASSIC_BRIDGE: "CLASSIC_BRIDGE",
  MULTI_BRIDGE: "MULTI_BRIDGE", /// FIXME: remove me,
  MULTI_CHAIN_BRIDGE: "MULTI_CHAIN_BRIDGE"
}


export const EXPIRY_OPTIONS = [
  {
    value: moment().add(3, 'M').format("YYYY-MM-DD"),
    label: '3 Months',
  },
  {
    value: moment().add(6, 'M').format("YYYY-MM-DD"),
    label: '6 Months',
  },
  {
    value: moment().add(1, 'y').format("YYYY-MM-DD"),
    label: '1 Year',
  },
]


export const BOBA_PROJECTS_CATEGORY = [ 'mainnet', 'testnet' ]

export const ECOSYSTEM_CATEGORY = [ 'defi', 'gamefi', 'nft', 'bridge', 'wallet', 'tool', 'token' ];

/*********************
 * Routes Constants **
 *********************/

export const ROUTES_PATH = {
  BRIDGE: '/bridge',
  ECOSYSTEM: '/ecosystem',
  BOBA_CHAINS: '/bobachains',
  WALLET: '/wallet',
  HISTORY: '/history',
  EARN: '/earn',
  LOCK: '/lock',
  STAKE: '/stake',
  HELP: '/help',
  BOBASCOPE: '/bobascope',
  MONSTER: '/monster',
  VOTE_DAO: '/votedao',
  DAO: '/DAO',
  DEV_TOOLS: '/devtools',
}
export const PER_PAGE = 8

export const PAGES_BY_NETWORK = {
  ethereum: ['Bridge', 'Ecosystem', 'Wallet', 'History', 'Earn', 'Stake', 'LinksToBobaChains', 'DAO', 'Monster'],
  bnb: ['Wallet', 'Earn', 'History', 'LinksToBobaChains' ],
  avax: ['Wallet', 'Earn', 'History', 'LinksToBobaChains' ],
  fantom: ['Wallet', 'Earn', 'History', 'LinksToBobaChains' ],
  moonbeam: ['Wallet', 'Earn', 'History', 'LinksToBobaChains' ],
}

export const LAYER = {
  L1: 'L1',
  L2: 'L2',
}


export const DEFAULT_NETWORK = {
  NAME: {
    L1: 'Ethereum',
    L2: 'Boba'
  },
  ICON: {
    L1: 'ethereum',
    L2: 'boba'
  }
}


export const MM_EXTENTION_URL = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en'

export const MIN_NATIVE_L1_BALANCE = 0.002
