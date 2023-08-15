import { BigNumberish, providers } from 'ethers'

import EthereumIcon from 'components/icons/chain/L1/EthereumIcon'
import BNBIcon from 'components/icons/chain/L1/BNBIcon'
import AvalancheIcon from 'components/icons/chain/L1/AvalancheIcon'

import BobaIcon from 'components/icons/chain/L2/BobaIcon'
import BobaBNBIcon from 'components/icons/chain/L2/BobaBNBIcon'
import BobaAvaxIcon from 'components/icons/chain/L2/BobaAvaxIcon'

import { ethereumConfig } from './config/ethereum'
import { bnbConfig } from './config/bnb'
import { avaxConfig } from './config/avax'
import { Layer, LAYER } from 'util/constant'
import { number } from 'prop-types'

export const L1_ICONS = {
  ethereum: EthereumIcon,
  bnb: BNBIcon,
  avax: AvalancheIcon,
}

export const L2_ICONS = {
  ethereum: BobaIcon,
  bnb: BobaBNBIcon,
  avax: BobaAvaxIcon,
}

export const NETWORK_TYPE = {
  MAINNET: 'Mainnet',
  TESTNET: 'Testnet',
}

export const NETWORK = {
  ETHEREUM: 'ETHEREUM',
  BNB: 'BNB',
  AVAX: 'AVAX',
}

export const CHAIN_ID_LIST = {
  5: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.ETHEREUM,
    layer: LAYER.L1,
  },
  2888: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.ETHEREUM,
    layer: LAYER.L2,
  },
  1: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.ETHEREUM,
    layer: LAYER.L1,
  },
  288: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.ETHEREUM,
    layer: LAYER.L2,
  },
  43113: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.AVAX,
    layer: LAYER.L1,
  },
  4328: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.AVAX,
    layer: LAYER.L2,
  },
  43114: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.AVAX,
    layer: LAYER.L1,
  },
  43288: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.AVAX,
    layer: LAYER.L2,
  },
  97: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.BNB,
    layer: LAYER.L1,
  },
  9728: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.BNB,
    layer: LAYER.L2,
  },
  56: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.BNB,
    layer: LAYER.L1,
  },
  56288: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.BNB,
    layer: LAYER.L2,
  },
}

export interface INetwork {
  icon: string
  chain: string
  label: string
  key: string
  name: { l1: string; l2: string }
  chainId: { [Layer.L1]: BigNumberish; [Layer.L2]: BigNumberish }
}

export const NetworkList: { Mainnet: INetwork[]; Testnet: INetwork[] } = {
  Mainnet: [
    {
      icon: 'ethereum',
      chain: NETWORK.ETHEREUM,
      label: 'Ethereum <> Boba',
      key: 'ethereum',
      name: {
        l1: 'Ethereum',
        l2: 'Boba',
      },
      chainId: { [Layer.L1]: '1', [Layer.L2]: '288' },
    },
    {
      icon: 'bnb',
      chain: NETWORK.BNB,
      label: 'BNB <> Boba',
      key: 'bnb',
      name: {
        l1: 'Binance Smart Chain',
        l2: 'Boba BNB',
      },
      chainId: { [Layer.L1]: '56', [Layer.L2]: '56288' },
    },
    {
      icon: 'avax',
      chain: NETWORK.AVAX,
      label: 'Avalanche <> Boba',
      key: 'avax',
      name: {
        l1: 'Avalanche Mainnet C-Chain',
        l2: 'Boba Avalanche',
      },
      chainId: { [Layer.L1]: '43114', [Layer.L2]: '43288' },
    },
  ],
  Testnet: [
    {
      icon: 'ethereum',
      chain: NETWORK.ETHEREUM,
      label: 'Ethereum (Goerli) <> Boba',
      key: 'ethereum',
      name: {
        l1: 'Ethereum (Goerli)',
        l2: 'Boba',
      },
      chainId: { [Layer.L1]: '5', [Layer.L2]: '2888' },
    },
    {
      icon: 'bnb',
      chain: NETWORK.BNB,
      label: 'BNB (Testnet) <> Boba',
      key: 'bnb',
      name: {
        l1: 'BNB Testnet',
        l2: 'Boba BNB Testnet',
      },
      chainId: { [Layer.L1]: '97', [Layer.L2]: '9728' },
    },
    {
      icon: 'avax',
      chain: NETWORK.AVAX,
      label: 'Fuji (Testnet) <> Boba',
      key: 'avax',
      name: {
        l1: 'Fuji Testnet',
        l2: 'Boba Fuji Testnet',
      },
      chainId: { [Layer.L1]: '43113', [Layer.L2]: '4328' },
    },
  ],
}

export const AllNetworkConfigs = {
  [NETWORK.ETHEREUM]: ethereumConfig,
  [NETWORK.BNB]: bnbConfig,
  [NETWORK.AVAX]: avaxConfig,
}

export const rpcUrls = Object.values(AllNetworkConfigs).reduce(
  (networkConfigs, networkConfig) => {
    networkConfigs[networkConfig.Mainnet.L1.chainId] =
      networkConfig.Mainnet.L1.rpcUrl[0]
    networkConfigs[networkConfig.Mainnet.L2.chainId] =
      networkConfig.Mainnet.L2.rpcUrl
    networkConfigs[networkConfig.Testnet.L1.chainId] =
      networkConfig.Testnet.L1.rpcUrl[0]
    networkConfigs[networkConfig.Testnet.L2.chainId] =
      networkConfig.Testnet.L2.rpcUrl
    return networkConfigs
  },
  {}
)

export const getNetworkDetail = ({ network, networkType }) => {
  return AllNetworkConfigs[network][networkType]
}

export const getRpcUrl = ({ network, networkType, layer }): string => {
  const rpcs = AllNetworkConfigs[network][networkType][layer]?.rpcUrl
  let randomRpc = rpcs
  if (Array.isArray(rpcs)) {
    randomRpc = rpcs[Math.floor(Math.random() * rpcs.length)]
  }
  return randomRpc
}

export const getBlockExplorerUrl = ({ network, networkType, layer }) => {
  return AllNetworkConfigs[network][networkType][layer]?.blockExplorerUrl
}

export const pingRpcUrl = async (rpcUrl) => {
  const provider = new providers.JsonRpcProvider(rpcUrl)
  try {
    await provider.getBlockNumber()
    return true
  } catch (e) {
    console.log(`Error pinging Rpc Url: ${rpcUrl}`)
    return false
  }
}
