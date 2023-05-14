import { providers } from 'ethers';

import EthereumIcon from 'components/icons/chain/L1/EthereumIcon';
import BNBIcon from 'components/icons/chain/L1/BNBIcon';
import AvalancheIcon from 'components/icons/chain/L1/AvalancheIcon';
import FantomIcon from 'components/icons/chain/L1/FantomIcon';

import BobaIcon from 'components/icons/chain/L2/BobaIcon';
import BobaBNBIcon from 'components/icons/chain/L2/BobaBNBIcon';
import BobaAvaxIcon from 'components/icons/chain/L2/BobaAvaxIcon';
import BobaFantomIcon from 'components/icons/chain/L2/BobaFantomIcon';

import { ethereumConfig } from './config/ethereum';
import { bnbConfig } from './config/bnb';
import { fantomConfig } from './config/fantom';
import { avaxConfig } from './config/avax';
import { LAYER } from 'util/constant';

export const L1_ICONS = {
  ethereum: EthereumIcon,
  bnb: BNBIcon,
  avax: AvalancheIcon,
  fantom: FantomIcon
}

export const L2_ICONS = {
  ethereum: BobaIcon,
  bnb: BobaBNBIcon,
  avax: BobaAvaxIcon,
  fantom: BobaFantomIcon
}


export const NETWORK_TYPE = {
  MAINNET: 'Mainnet',
  TESTNET: 'Testnet'
}

export const NETWORK = {
  ETHEREUM: 'ETHEREUM',
  BNB: 'BNB',
  FANTOM: 'FANTOM',
  AVAX: 'AVAX'
}


export const CHAIN_ID_LIST = {
  5: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.ETHEREUM,
    layer: LAYER.L1
  },
  2888: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.ETHEREUM,
    layer: LAYER.L2
  },
  1: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.ETHEREUM,
    layer: LAYER.L1
  },
  288: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.ETHEREUM,
    layer: LAYER.L2
  },
  43113: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.AVAX,
    layer: LAYER.L1
  },
  4328: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.AVAX,
    layer: LAYER.L2
  },
  43114: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.AVAX,
    layer: LAYER.L1
  },
  43288: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.AVAX,
    layer: LAYER.L2
  },
  97: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.BNB,
    layer: LAYER.L1
  },
  9728: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.BNB,
    layer: LAYER.L2
  },
  56: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.BNB,
    layer: LAYER.L1
  },
  56288: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.BNB,
    layer: LAYER.L2
  },
  4002: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.FANTOM,
    layer: LAYER.L1
  },
  4051: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.FANTOM,
    layer: LAYER.L2
  },
  250: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.FANTOM,
    layer: LAYER.L1
  },
  301: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.FANTOM,
    layer: LAYER.L2
  }
}

export const NetworkList = {
  Mainnet: [
    {
      icon: 'ethereum',
      chain: NETWORK.ETHEREUM,
      label: 'Ethereum <> Boba',
      key: 'ethereum',
      name: {
        l1: 'Ethereum',
        l2: 'Boba'
      }
    },
    {
      icon: 'bnb',
      chain: NETWORK.BNB,
      label: 'BNB <> Boba',
      key: 'bnb',
      name: {
        l1: 'Binance Smart Chain',
        l2: 'Boba BNB'
      }
    },
    {
      icon: 'avax',
      chain: NETWORK.AVAX,
      label: 'Avalanche <> Boba',
      key: 'avax',
      name: {
        l1: 'Avalanche Mainnet C-Chain',
        l2: 'Boba Avalanche'
      }
    },
    {
      icon: 'fantom',
      chain: NETWORK.FANTOM,
      label: 'Fantom <> Boba',
      key: 'fantom',
      name: {
        l1: 'Fantom',
        l2: 'Bobaopera'
      }
    }
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
      }
    },
    {
      icon: 'bnb',
      chain: NETWORK.BNB,
      label: 'BNB (Testnet) <> Boba',
      key: 'bnb',
      name: {
        l1: 'BNB Testnet',
        l2: 'Boba BNB Testnet',
      }
    },
    {
      icon: 'avax',
      chain: NETWORK.AVAX,
      label: 'Fuji (Testnet) <> Boba',
      key: 'avax',
      name: {
        l1: 'Fuji Testnet',
        l2: 'Boba Fuji Testnet',
      }
    },
    {
      icon: 'fantom',
      chain: NETWORK.FANTOM,
      label: 'Opera (Testnet) <> Boba',
      key: 'fantom',
      name: {
        l1: 'Fantom Testnet',
        l2: 'Bobaopera Testnet',
      }
    }
  ]
}

const networkConfig = {
  [NETWORK.ETHEREUM] : ethereumConfig,
  [NETWORK.BNB] : bnbConfig,
  [NETWORK.FANTOM] : fantomConfig,
  [NETWORK.AVAX] : avaxConfig
}

export const rpcUrls = Object.values(networkConfig).reduce((networkConfigs, networkConfig) => {
  networkConfigs[networkConfig.Mainnet.L1.chainId] = networkConfig.Mainnet.L1.rpcUrl[0]
  networkConfigs[networkConfig.Mainnet.L2.chainId] = networkConfig.Mainnet.L2.rpcUrl
  networkConfigs[networkConfig.Testnet.L1.chainId] = networkConfig.Testnet.L1.rpcUrl[0]
  networkConfigs[networkConfig.Testnet.L2.chainId] = networkConfig.Testnet.L2.rpcUrl
  return networkConfigs
}, {})

export const getNetworkDetail = ({
  network,
  networkType
}) => {
  return networkConfig[network][networkType]
}

export const getBlockExplorerUrl = ({
  network,
  networkType,
  layer
}) => {
  return networkConfig[network][networkType][layer]?.blockExplorerUrl
}

export const pingRpcUrl = async (
  rpcUrl,
) => {
  const provider = new providers.JsonRpcProvider(rpcUrl)
  try {
    await provider.getBlockNumber()
    return true
  } catch (e) {
    console.log(`Error pinging Rpc Url: ${rpcUrl}`)
    return false
  }
}
