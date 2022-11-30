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
  MOONBASE: 'MOONBASE',
}


export const NetworkList = {
  Mainnet: [
    {
      icon: 'ethereum',
      chain: NETWORK.ETHEREUM,
      label: 'Ethereum <> Boba',
      key: 'ethereum'
    },
    {
      icon: 'bnb',
      chain: NETWORK.BNB,
      label: 'BNB <> Boba',
      key: 'bnb'
    },
    {
      icon: 'avax',
      chain: NETWORK.AVAX,
      label: 'Avalanche <> Boba',
      key: 'avax'
    },
    {
      icon: 'fantom',
      chain: NETWORK.FANTOM,
      label: 'Fantom <> Boba',
      key: 'fantom'
    },
    {
      icon: 'moonbeam',
      chain: NETWORK.MOONBEAM,
      label: 'Moonbeam <> Boba',
      key: 'moonbeam'
    },
    {
      icon: 'moonbase',
      chain: NETWORK.MOONBASE,
      label: 'Moonbase <> Boba',
      key: 'moonbase'
    },
  ],
  Testnet: [
    {
      icon: 'ethereum',
      chain: NETWORK.ETHEREUM,
      label: 'Ethereum (Goerli) <> Boba',
      key: 'ethereum'
    },
    {
      icon: 'bnb',
      chain: NETWORK.BNB,
      label: 'BNB (Testnet) <> Boba',
      key: 'bnb'
    },
    {
      icon: 'avax',
      chain: NETWORK.AVAX,
      label: 'Fuji (Testnet) <> Boba',
      key: 'avax'
    },
    {
      icon: 'fantom',
      chain: NETWORK.FANTOM,
      label: 'Opera (Testnet) <> Boba',
      key: 'fantom'
    },
  ]
}


const networkConfig = {
  [NETWORK.ETHEREUM] : ethereumConfig,
  [NETWORK.BNB] : ethereumConfig,
  [NETWORK.FANTOM] : ethereumConfig,
  [NETWORK.AVAX] : ethereumConfig,
  [NETWORK.MOONBEAM] : ethereumConfig,
  [NETWORK.MOONBASE] : ethereumConfig,
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
