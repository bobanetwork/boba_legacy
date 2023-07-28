import AllNetworksIcon from '../../images/allNetworks.svg'
import { IDropdownItem } from 'components/global/dropdown'
import { IFilterDropdownItem } from 'components/filter'
import { TableHeaderOptionType } from 'components/global/table'
import { getCoinImage } from 'util/coinImage'
import { NETWORK_TYPE } from 'util/network/network.util'
import { CHAIN_NAME, LAYER, ChainMap } from './types'

export const Chains: ChainMap = {
  [CHAIN_NAME.All_Networks]: {
    chainId: '0',
    layer: LAYER.L1,
  },
  [CHAIN_NAME.BNB]: {
    chainId: '56',
    layer: LAYER.L1,
  },
  [CHAIN_NAME.Boba_BNB]: {
    chainId: '56288',
    parentChainId: '56',
    layer: LAYER.L2,
  },
  [CHAIN_NAME.BNB_Testnet]: {
    chainId: '97',
    layer: LAYER.L1,
  },
  [CHAIN_NAME.Boba_BNB_Testnet]: {
    chainId: '9728',
    parentChainId: '97',
    layer: LAYER.L2,
  },
  [CHAIN_NAME.Ethereum]: {
    chainId: '1',
    layer: LAYER.L1,
  },
  [CHAIN_NAME.Boba_Ethereum]: {
    chainId: '288',
    parentChainId: '1',
    layer: LAYER.L2,
  },
  [CHAIN_NAME.Goerli]: {
    chainId: '5',
    layer: LAYER.L1,
  },
  [CHAIN_NAME.Boba_Goerli]: {
    parentChainId: '5',
    chainId: '2888',
    layer: LAYER.L2,
  },
}

// [transaction chain ][address] -> token
//
export const ALL_NETWORKS: IDropdownItem = {
  value: Chains[CHAIN_NAME.All_Networks].chainId,
  label: 'All Networks',
  imgSrc: AllNetworksIcon,
  header: false,
  headerName: '',
}
export const NETWORK_L1_OPTIONS: IDropdownItem[] = [
  ALL_NETWORKS,
  {
    value: Chains[CHAIN_NAME.Ethereum].chainId,
    label: 'Ethereum',
    imgSrc: getCoinImage('ETH'),
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: Chains[CHAIN_NAME.BNB].chainId,
    label: 'BNB',
    imgSrc: getCoinImage('BNB'),
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: Chains[CHAIN_NAME.Goerli].chainId,
    label: 'Ethereum (Goerli)',
    imgSrc: getCoinImage('ETH'),
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: Chains[CHAIN_NAME.BNB_Testnet].chainId,
    label: 'BNB Testnet',
    imgSrc: getCoinImage('BNB'),
    headerName: NETWORK_TYPE.TESTNET,
  },
]

export const NETWORK_L2_OPTIONS = [
  ALL_NETWORKS,
  {
    value: Chains[CHAIN_NAME.Boba_Ethereum].chainId,
    label: 'Boba Ethereum',
    imgSrc: getCoinImage('BOBA'),
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: Chains[CHAIN_NAME.Boba_BNB].chainId,
    label: 'Boba BNB',
    imgSrc: getCoinImage('BOBA'),
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: Chains[CHAIN_NAME.Boba_Goerli].chainId,
    label: 'Boba (Goerli)',
    imgSrc: getCoinImage('BOBA'),
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: Chains[CHAIN_NAME.Boba_BNB_Testnet].chainId,
    label: 'Boba BNB (Testnet)',
    imgSrc: getCoinImage('BOBA'),
    headerName: NETWORK_TYPE.TESTNET,
  },
]

export const FILTER_OPTIONS: IFilterDropdownItem[] = [
  { value: 'All', label: 'All Status' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Canceled', label: 'Canceled' },
]

export const TableOptions: TableHeaderOptionType[] = [
  {
    name: 'Date',
    width: 168,
    tooltip: '',
  },
  {
    name: 'From',
    width: 142,
    tooltip: '',
  },
  {
    name: 'To',
    width: 142,
    tooltip: '',
  },
  {
    name: 'Token',
    width: 90,
    tooltip: '',
  },
  { name: 'Amount', width: 80, tooltip: '' },
  { name: 'Status', width: 88, tooltip: '' },
]
