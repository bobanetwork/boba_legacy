import Synapse from 'assets/images/bridges/synapse.svg'
import Symbiosis from 'assets/images/bridges/symbiosis.svg'
import Polybridge from 'assets/images/bridges/polybridge.svg'
import Celer from 'assets/images/bridges/celer.svg'
import Anyswap from 'assets/images/bridges/anyswap.svg'
import BoringDao from 'assets/images/bridges/boringdao.svg'

export interface IBridges {
  name: string
  icon: any
  type: string
  link: string
  tokens: string[]
}

export const bobaBridges: IBridges[] = [
  {
    name: 'Synapse',
    icon: Synapse,
    type: 'SYNAPSE',
    link: 'https://synapseprotocol.com/',
    tokens: ['ETH', 'nETH', 'gOHM', 'DAI', 'USDC', 'USDT', 'SYN', 'nUSD'],
  },
  {
    name: 'Anyswap',
    icon: Anyswap,
    type: 'ANYSWAP',
    link: 'https://anyswap.exchange/#/router',
    tokens: ['MIM', 'AVAX', 'FRAX', 'FTM', 'FXS', 'MATIC'],
  },
  {
    name: 'Celer',
    icon: Celer,
    type: 'CELER',
    link: 'https://cbridge.celer.network/#/transfer',
    tokens: ['ETH', 'BOBA', 'FRAX', 'OLO'],
  },
  {
    name: 'BoringDAO',
    icon: BoringDao,
    type: 'BORINGDAO',
    link: 'https://oportal.boringdao.com/twoway',
    tokens: ['USDT'],
  },
  {
    name: 'PolyBridge',
    icon: Polybridge,
    type: 'POLYBRIDGE',
    link: 'https://bridge.poly.network/',
    tokens: ['BOBA'],
  },
  {
    name: 'Symbiosis',
    icon: Symbiosis,
    type: 'SYMBIOSIS',
    link: 'https://app.symbiosis.finance/swap',
    tokens: ['USDC'],
  },
]

export const bridgeByToken = (symbol: string) => {
  return bobaBridges.filter((bridge) => bridge.tokens.includes(symbol))
}
