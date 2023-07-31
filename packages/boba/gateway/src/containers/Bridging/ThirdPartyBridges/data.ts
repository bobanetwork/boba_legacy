import AnyswapLogo from 'assets/images/bridges/logo/anyswap-logo-250.png'
import BoringdaoLogo from 'assets/images/bridges/logo/Boringdao-logo-250.png'
import CelerLogo from 'assets/images/bridges/logo/celer-logo-250.png'
import PolybridgeLogo from 'assets/images/bridges/logo/polybridge-logo-250.png'
import SymbiosisLogo from 'assets/images/bridges/logo/symbiosis-logo-250.png'
import SynapseLogo from 'assets/images/bridges/logo/synapse-logo-250.png'

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
    icon: SynapseLogo,
    type: 'SYNAPSE',
    link: 'https://synapseprotocol.com/',
    tokens: ['ETH', 'nETH', 'gOHM', 'DAI', 'USDC', 'USDT', 'SYN', 'nUSD'],
  },
  {
    name: 'Anyswap',
    icon: AnyswapLogo,
    type: 'ANYSWAP',
    link: 'https://anyswap.exchange/#/router',
    tokens: ['MIM', 'AVAX', 'FRAX', 'FTM', 'FXS', 'MATIC'],
  },
  {
    name: 'Celer',
    icon: CelerLogo,
    type: 'CELER',
    link: 'https://cbridge.celer.network/#/transfer',
    tokens: ['ETH', 'BOBA', 'FRAX', 'OLO'],
  },
  {
    name: 'BoringDAO',
    icon: BoringdaoLogo,
    type: 'BORINGDAO',
    link: 'https://oportal.boringdao.com/twoway',
    tokens: ['USDT'],
  },
  {
    name: 'PolyBridge',
    icon: PolybridgeLogo,
    type: 'POLYBRIDGE',
    link: 'https://bridge.poly.network/',
    tokens: ['BOBA'],
  },
  {
    name: 'Symbiosis',
    icon: SymbiosisLogo,
    type: 'SYMBIOSIS',
    link: 'https://app.symbiosis.finance/swap',
    tokens: ['USDC'],
  },
]

export const bridgeByToken = (symbol: string) => {
  return bobaBridges.filter((bridge) => bridge.tokens.includes(symbol))
}
