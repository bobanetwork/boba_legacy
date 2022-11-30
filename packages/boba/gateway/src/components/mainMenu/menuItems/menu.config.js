import { ROUTES_PATH } from "util/constant";

export const pagesByChain = {
  ethereum: ['Bridge', 'Ecosystem', 'Wallet', 'History', 'Earn', 'Stake', 'LinksToBobaChains', 'DAO' ],
  bnb: ['Bridge', 'Ecosystem', 'Wallet', 'History', 'LinksToBobaChains' ],
  avax: ['Bridge', 'Ecosystem', 'Wallet', 'History', 'LinksToBobaChains' ],
  fantom: ['Bridge', 'Ecosystem', 'Wallet', 'History', 'LinksToBobaChains' ],
  moonbeam: ['Bridge', 'Ecosystem', 'Wallet', 'History', 'LinksToBobaChains' ],
  moonbase: ['Bridge', 'Ecosystem', 'Wallet', 'History', 'LinksToBobaChains' ],
}

export const MENU_LIST = [
  {
    key: 'Bridge',
    icon: "WalletIcon",
    title: "Bridge",
    url: ROUTES_PATH.BRIDGE
  },
  {
    key: 'Ecosystem',
    icon: "SafeIcon",
    title: "Ecosystem",
    url: ROUTES_PATH.ECOSYSTEM
  },
  {
    key: 'Wallet',
    icon: "WalletIcon",
    title: "Wallet",
    url: ROUTES_PATH.WALLET
  },
  {
    key: 'History',
    icon: "HistoryIcon",
    title: "History",
    url: ROUTES_PATH.HISTORY
  },
  {
    key: 'Earn',
    icon: "EarnIcon",
    title: "Earn",
    url: ROUTES_PATH.EARN
  },
  {
    key: 'Stake',
    icon: "StakeIcon",
    title: "Stake",
    url: ROUTES_PATH.STAKE
  },
  {
    key: 'Lock',
    icon: "LockIcon",
    title: "Lock",
    url: ROUTES_PATH.LOCK,
  },
  {
    key: 'Vote&Dao',
    icon: "VoteIcon",
    title: "Vote&Dao",
    url: ROUTES_PATH.VOTE_DAO
  },
  {
    key: 'DAO',
    icon: "VoteIcon",
    title: "Dao",
    url: ROUTES_PATH.DAO
  },
  {
    key: 'LinksToBobaChains',
    icon: "LinksToBobaChainsIcon",
    title: "BOBA Chains",
    url: ROUTES_PATH.BOBA_CHAINS
  }
]
