import EthereumIcon from 'components/icons/chain/L1/EthereumIcon';
import BNBIcon from 'components/icons/chain/L1/BNBIcon';
import AvalancheIcon from 'components/icons/chain/L1/AvalancheIcon';
import FantomIcon from 'components/icons/chain/L1/FantomIcon';
import MoonbeamIcon from 'components/icons/chain/L1/MoonbeamIcon';
import MoonbaseIcon from 'components/icons/chain/L1/MoonbaseIcon';

import BobaIcon from 'components/icons/chain/L2/BobaIcon';
import BobaBNBIcon from 'components/icons/chain/L2/BobaBNBIcon';
import BobaAvaxIcon from 'components/icons/chain/L2/BobaAvaxIcon';
import BobaFantomIcon from 'components/icons/chain/L2/BobaFantomIcon';
import BobabeamIcon from 'components/icons/chain/L2/BobabeamIcon';
import BobabaseIcon from 'components/icons/chain/L2/BobabaseIcon';

import { ethereumConfig } from './config/ethereum';
import { bnbConfig } from './config/bnb';
import { fantomConfig } from './config/fantom';
import { avaxConfig } from './config/avax';
import { moonbeamConfig } from './config/moonbeam';
import { LAYER } from 'util/constant';

export const L1_ICONS = {
  ethereum: EthereumIcon,
  bnb: BNBIcon,
  avax: AvalancheIcon,
  fantom: FantomIcon,
  moonbeam: MoonbeamIcon,
  moonbase: MoonbaseIcon,
}

export const L2_ICONS = {
  ethereum: BobaIcon,
  bnb: BobaBNBIcon,
  avax: BobaAvaxIcon,
  fantom: BobaFantomIcon,
  moonbeam: BobabeamIcon,
  moonbase: BobabaseIcon,
}


export const NETWORK_TYPE = {
  MAINNET: 'Mainnet',
  TESTNET: 'Testnet'
}

export const NETWORK = {
  ETHEREUM: 'ETHEREUM',
  BNB: 'BNB',
  FANTOM: 'FANTOM',
  AVAX: 'AVAX',
  MOONBEAM: 'MOONBEAM',
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
  },
  1287: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.MOONBEAM,
    layer: LAYER.L1
  },
  1297: {
    networkType: NETWORK_TYPE.TESTNET,
    chain: NETWORK.MOONBEAM,
    layer: LAYER.L2
  },
  1284: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.MOONBEAM,
    layer: LAYER.L1
  },
  1294: {
    networkType: NETWORK_TYPE.MAINNET,
    chain: NETWORK.MOONBEAM,
    layer: LAYER.L2
  },
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
        l1: 'Binance Smart Chain Mainnet',
        l2: 'Boba BNB Mainnet'
      }
    },
    {
      icon: 'avax',
      chain: NETWORK.AVAX,
      label: 'Avalanche <> Boba',
      key: 'avax',
      name: {
        l1: 'Avalanche Mainnet C-Chain',
        l2: 'Boba Avalance Mainnet'
      }
    },
    {
      icon: 'fantom',
      chain: NETWORK.FANTOM,
      label: 'Fantom <> Boba',
      key: 'fantom',
      name: {
        l1: 'Fantom Mainnet',
        l2: 'Bobaopera Mainnet'
      }
    },
    {
      icon: 'moonbeam',
      chain: NETWORK.MOONBEAM,
      label: 'Moonbeam <> Boba',
      key: 'moonbeam',
      name: {
        l1: 'Moonbeam',
        l2: 'Bobabeam'
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
    },
    {
      icon: 'moonbase',
      chain: NETWORK.MOONBEAM,
      label: 'Moonbase <> Boba',
      key: 'moonbeam',
      name: {
        l1: 'Moonbase',
        l2: 'Bobabase',
      }
    },
  ]
}

const networkConfig = {
  [NETWORK.ETHEREUM] : ethereumConfig,
  [NETWORK.BNB] : bnbConfig,
  [NETWORK.FANTOM] : fantomConfig,
  [NETWORK.AVAX] : avaxConfig,
  [NETWORK.MOONBEAM] : moonbeamConfig
}

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
