import { MetamaskNetwork } from './types'

export const Binance: MetamaskNetwork = {
  networkName: 'Binance Mainnet',
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  chainId: '56',
  symbol: 'BNB',
  blockExplorer: 'https://bscscan.com',
  isTestnet: false,
}

export const Avalanche: MetamaskNetwork = {
  networkName: 'Avalanche Mainnet',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  chainId: '43114',
  symbol: 'AVAX',
  blockExplorer: 'https://snowtrace.io/',
  isTestnet: false,
}
