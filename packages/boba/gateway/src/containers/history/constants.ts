import AllNetworksIcon from 'assets/images/allNetworks.svg'
import { IDropdownItem } from 'components/global/dropdown'
import { IFilterDropdownItem } from 'components/filter'
import { TableHeaderOptionType } from 'components/global/table'
import { getCoinImage } from 'util/coinImage'
import { NETWORK_TYPE } from 'util/network/network.util'
import { CHAIN_NAME, ChainMap } from './types'

import bobaEth from 'assets/images/bobaETH.png'
import bobaBnb from 'assets/images/bobaBNB.png'
import bobaAvax from 'assets/images/bobaAvax.png'

import ethIcon from 'assets/ethereum.svg'

export const Chains: ChainMap = {
  '0': {
    name: CHAIN_NAME.All_Networks,
    transactionUrlPrefix: '',
    symbol: '',
  },
  '56': {
    name: CHAIN_NAME.BNB,
    transactionUrlPrefix: 'https://bscscan.com/tx/',
    symbol: 'BNB',
  },
  '56288': {
    name: CHAIN_NAME.Boba_BNB,
    transactionUrlPrefix: 'https://blockexplorer.bnb.boba.network/tx/',
    symbol: 'BOBA',
  },
  '97': {
    name: CHAIN_NAME.BNB_Testnet,
    transactionUrlPrefix: 'https://testnet.bscscan.com/tx/',
    symbol: 'BNB',
  },
  '9728': {
    name: CHAIN_NAME.Boba_BNB_Testnet,
    transactionUrlPrefix: 'https://blockexplorer.testnet.bnb.boba.network/tx/',
    symbol: 'BOBA',
  },
  '1': {
    name: CHAIN_NAME.Ethereum,
    transactionUrlPrefix: 'https://etherscan.io/tx/',
    symbol: 'ETH',
  },
  '288': {
    name: CHAIN_NAME.Boba_Ethereum,
    transactionUrlPrefix: 'https://bobascan.com/tx/',
    symbol: 'BOBA',
  },
  '5': {
    name: CHAIN_NAME.Goerli,
    transactionUrlPrefix: 'https://goerli.etherscan.io/tx/',
    symbol: 'ETH',
  },
  '2888': {
    name: CHAIN_NAME.Boba_Goerli,
    transactionUrlPrefix: 'https://testnet.bobascan.com/tx/',
    symbol: 'BOBA',
  },
}

export const ALL_NETWORKS: IDropdownItem = {
  value: '0',
  label: 'All Networks',
  imgSrc: AllNetworksIcon,
  header: false,
  headerName: '',
}
export const NETWORK_L1_OPTIONS: IDropdownItem[] = [
  ALL_NETWORKS,
  {
    value: '1',
    label: 'Ethereum',
    imgSrc: ethIcon,
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '56',
    label: 'BNB',
    imgSrc: getCoinImage('BNB'),
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '43114',
    label: 'AVAX',
    imgSrc: getCoinImage('AVAX'),
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '5',
    label: 'Ethereum Goerli',
    imgSrc: ethIcon,
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: '97',
    label: 'BNB Testnet',
    imgSrc: getCoinImage('BNB'),
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: '43113',
    label: 'Avax Testnet',
    imgSrc: getCoinImage('AVAX'),
    headerName: NETWORK_TYPE.TESTNET,
  },
]

export const NETWORK_L2_OPTIONS = [
  ALL_NETWORKS,
  {
    value: '288',
    label: 'Boba Ethereum',
    imgSrc: bobaEth,
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '56288',
    label: 'Boba BNB',
    imgSrc: bobaBnb,
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '43288',
    label: 'Boba Avax',
    imgSrc: bobaAvax,
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '2888',
    label: 'Boba Goerli',
    imgSrc: bobaEth,
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: '9728',
    label: 'Boba BNB Testnet',
    imgSrc: bobaBnb,
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: '4328',
    label: 'Boba Avax Testnet',
    imgSrc: bobaAvax,
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