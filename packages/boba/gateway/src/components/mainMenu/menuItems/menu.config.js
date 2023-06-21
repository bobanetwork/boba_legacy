import { DISABLE_VE_DAO, ROUTES_PATH } from "util/constant";

export const MENU_LIST = [
  {
    key: 'Bridge',
    icon: "WalletIcon",
    title: "Bridge",
    url: ROUTES_PATH.BRIDGE
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
    disable: !!Number(DISABLE_VE_DAO)
  },
  {
    key: 'Vote&Dao',
    icon: "VoteIcon",
    title: "Vote&Dao",
    url: ROUTES_PATH.VOTE_DAO,
    disable: !!Number(DISABLE_VE_DAO)
  },
  {
    key: 'DAO',
    icon: "VoteIcon",
    title: "Dao",
    url: ROUTES_PATH.DAO
  }
]
