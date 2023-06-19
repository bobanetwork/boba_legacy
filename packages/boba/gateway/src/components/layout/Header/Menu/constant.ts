import { ROUTES_PATH } from 'util/constant'
import { IMenuItem } from './types'

export const MENU_LIST: Array<IMenuItem> = [
  {
    label: 'Bridge',
    path: ROUTES_PATH.BRIDGE,
  },
  {
    label: 'Ecosystem',
    path: ROUTES_PATH.ECOSYSTEM,
  },
  {
    label: 'History',
    path: ROUTES_PATH.HISTORY,
  },
  {
    label: 'Earn',
    path: ROUTES_PATH.EARN,
  },
  {
    label: 'Stake',
    path: ROUTES_PATH.STAKE,
  },
  {
    label: 'Dao',
    path: ROUTES_PATH.DAO,
  },
]
