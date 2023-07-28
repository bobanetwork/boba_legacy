export interface IBridges {
  name: string
  icon: string
  type: string
  link: string
  tokens: string[]
}

export const bobaBridges: IBridges[] = [
  {
    name: 'Synapse',
    icon: 'synapse',
    type: 'SYNAPSE',
    link: 'https://synapseprotocol.com/',
    tokens: ['ETH', 'nETH', 'gOHM', 'DAI', 'USDC', 'USDT', 'SYN', 'nUSD'],
  },
  {
    name: 'Anyswap',
    icon: 'anyswap',
    type: 'ANYSWAP',
    link: 'https://anyswap.exchange/#/router',
    tokens: ['MIM', 'AVAX', 'FRAX', 'FTM', 'FXS', 'MATIC'],
  },
  {
    name: 'Celer',
    icon: 'celer',
    type: 'CELER',
    link: 'https://cbridge.celer.network/#/transfer',
    tokens: ['ETH', 'BOBA', 'FRAX', 'OLO'],
  },
  {
    name: 'BoringDAO',
    icon: 'boringdao',
    type: 'BORINGDAO',
    link: 'https://oportal.boringdao.com/twoway',
    tokens: ['USDT'],
  },
  {
    name: 'PolyBridge',
    icon: 'polybridge',
    type: 'POLYBRIDGE',
    link: 'https://bridge.poly.network/',
    tokens: ['BOBA'],
  },
  {
    name: 'Symbiosis',
    icon: 'symbiosis',
    type: 'SYMBIOSIS',
    link: 'https://app.symbiosis.finance/swap',
    tokens: ['USDC'],
  },
]

export const bridgeByToken = (symbol: string) => {
  return bobaBridges.filter((bridge) => bridge.tokens.includes(symbol))
}
