import React from 'react';

import moment from 'moment'
import EthereumIcon from 'components/icons/chain/L1/EthereumIcon';
import BNBIcon from 'components/icons/chain/L1/BNBIcon';
import AvalancheIcon from 'components/icons/chain/L1/AvalancheIcon';
import FantomIcon from 'components/icons/chain/L1/FantomIcon';
import MoonbeamIcon from 'components/icons/chain/L1/MoonbeamIcon';

import BobaIcon from 'components/icons/chain/L2/BobaIcon';
import BobaBNBIcon from 'components/icons/chain/L2/BobaBNBIcon';
import BobaAvaxIcon from 'components/icons/chain/L2/BobaAvaxIcon';
import BobaFantomIcon from 'components/icons/chain/L2/BobaFantomIcon';
import BobabeamIcon from 'components/icons/chain/L2/BobabeamIcon';

/**************
 * Env Params *
 **************/
require('dotenv').config()

export const POLL_INTERVAL = process.env.REACT_APP_POLL_INTERVAL || 20000
export const GAS_POLL_INTERVAL = process.env.REACT_APP_GAS_POLL_INTERVAL || 40000
export const GA4_MEASUREMENT_ID = process.env.REACT_APP_GA4_MEASUREMENT_ID || null
export const APP_ENV = process.env.REACT_APP_ENV || 'dev'
export const APP_CHAIN = process.env.REACT_APP_CHAIN
export const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || null
export const APP_ZENDESK_KEY = process.env.REACT_APP_ZENDESK_KEY || null
export const INFURA_ID = process.env.REACT_APP_INFURA_ID
export const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API
export const MAX_HEALTH_BLOCK_LAG = process.env.REACT_APP_MAX_HEALTH_BLOCK_LAG
export const WALLET_VERSION = process.env.REACT_APP_WALLET_VERSION
export const APP_STATUS = process.env.REACT_APP_STATUS || 'normal'
export const SELLER_OPTIMISM_API_URL = process.env.REACT_APP_SELLER_OPTIMISM_API_URL
export const SERVICE_OPTIMISM_API_URL = process.env.REACT_APP_SERVICE_OPTIMISM_API_URL
export const SPEED_CHECK = process.env.REACT_APP_SPEED_CHECK
export const TARGET_CHAIN_URL = process.env.REACT_APP_TARGET_CHAIN_URL
// VE DAO FLAG
export const DISABLE_VE_DAO = process.env.REACT_APP_DISABLE_VE_DAO

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
}
export const PER_PAGE = 8


export const L1Icons = {
  ethereum: <EthereumIcon />,
  bnb: <BNBIcon />,
  avax: <AvalancheIcon />,
  fantom: <FantomIcon />,
  moonbeam: <MoonbeamIcon />,
}

export const L2Icons = {
  ethereum: <BobaIcon />,
  bnb: <BobaBNBIcon />,
  avax: <BobaAvaxIcon />,
  fantom: <BobaFantomIcon />,
  moonbeam: <BobabeamIcon />,
}
