import { tabSwitcherTypes } from './types'

export const TabSwitcherEnum: tabSwitcherTypes = {
  L1LP: {
    name: 'L1LP',
    tab: 'Ethereum Pool',
  },
  L2LP: {
    name: 'L2LP',
    tab: 'Boba L2 Pool',
  },
}

export const tableHeaderOptions = [
  { name: 'Token', width: 225 },
  {
    name: 'Available Balance',
    tooltip:
      'Available Balance refers to the amount of funds currently in each pool.',
    width: 145,
  },
  {
    name: 'Total Staked',
    tooltip: 'Total staked denotes the funds staked by liquidity providers.',
    width: 115,
  },
  {
    name: 'APR',
    tooltip:
      'The APR is the historical APR, which reflects the fees people paid to bridge and the previous usage patterns for each pool.',
    width: 85,
  },
  { name: 'Your Stake', width: 90 },
  { name: 'Earned', width: 110 },
  { name: 'Actions', width: 75 },
]
