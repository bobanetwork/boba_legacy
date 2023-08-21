import AllNetworksIcon from 'assets/images/allNetworks.svg'
import { IDropdownItem } from 'components/global/dropdown'
import { IFilterDropdownItem } from 'components/filter'
import { TableHeaderOptionType } from 'components/global/table'
import { getCoinImage } from 'util/coinImage'
import { NETWORK_TYPE } from 'util/network/network.util'
import { CHAIN_NAME, ChainMap } from './types'

import bobaEth from 'assets/bobaEth.svg'
import bobaBnb from 'assets/bobaBNB.svg'
import bobaAvax from 'assets/bobaAvax.svg'

import ethIcon from 'assets/ethereum.svg'

export const Chains: ChainMap = {
  '0': {
    name: CHAIN_NAME.All_Networks,
    transactionUrlPrefix: '',
    symbol: '',
    imgSrc: ethIcon,
  },
  '56': {
    name: CHAIN_NAME.BNB,
    transactionUrlPrefix: 'https://bscscan.com/tx/',
    symbol: 'BNB',
    imgSrc: getCoinImage('BNB'),
  },
  '56288': {
    name: CHAIN_NAME.Boba_BNB,
    transactionUrlPrefix: 'https://blockexplorer.bnb.boba.network/tx/',
    symbol: 'BOBA',
    imgSrc: bobaBnb,
  },
  '97': {
    name: CHAIN_NAME.BNB_Testnet,
    transactionUrlPrefix: 'https://testnet.bscscan.com/tx/',
    symbol: 'BNB',
    imgSrc: getCoinImage('BNB'),
  },
  '9728': {
    name: CHAIN_NAME.Boba_BNB_Testnet,
    transactionUrlPrefix: 'https://blockexplorer.testnet.bnb.boba.network/tx/',
    symbol: 'BOBA',
    imgSrc: bobaBnb,
  },
  '1': {
    name: CHAIN_NAME.Ethereum,
    transactionUrlPrefix: 'https://etherscan.io/tx/',
    symbol: 'ETH',
    imgSrc: ethIcon,
  },
  '288': {
    name: CHAIN_NAME.Boba_Ethereum,
    transactionUrlPrefix: 'https://bobascan.com/tx/',
    symbol: 'BOBA',
    imgSrc: bobaEth,
  },
  '5': {
    name: CHAIN_NAME.Goerli,
    transactionUrlPrefix: 'https://goerli.etherscan.io/tx/',
    symbol: 'ETH',
    imgSrc: ethIcon,
  },
  '2888': {
    name: CHAIN_NAME.Boba_Goerli,
    transactionUrlPrefix: 'https://testnet.bobascan.com/tx/',
    symbol: 'BOBA',
    imgSrc: bobaEth,
  },
  '43114': {
    name: CHAIN_NAME.Avalanche,
    transactionUrlPrefix: 'https://snowtrace.io/tx/',
    symbol: 'AVAX',
    imgSrc: getCoinImage('AVAX'),
  },
  '43288': {
    name: CHAIN_NAME.Boba_Avalanche,
    transactionUrlPrefix: 'https://blockexplorer.avax.boba.network/tx/',
    symbol: 'BOBA',
    imgSrc: bobaAvax,
  },
  '43113': {
    name: CHAIN_NAME.Avalanche_Testnet,
    transactionUrlPrefix: 'https://testnet.snowtrace.io/tx/',
    symbol: 'AVAX',
    imgSrc: getCoinImage('AVAX'),
  },
  '4328': {
    name: CHAIN_NAME.Boba_Avalanche_Testnet,
    transactionUrlPrefix: 'https://blockexplorer.testnet.avax.boba.network/tx/',
    symbol: 'BOBA',
    imgSrc: bobaAvax,
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
    label: CHAIN_NAME.Ethereum,
    imgSrc: ethIcon,
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '56',
    label: CHAIN_NAME.BNB,
    imgSrc: getCoinImage('BNB'),
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '43114',
    label: CHAIN_NAME.Avalanche,
    imgSrc: getCoinImage('AVAX'),
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '5',
    label: CHAIN_NAME.Goerli,
    imgSrc: ethIcon,
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: '97',
    label: CHAIN_NAME.BNB_Testnet,
    imgSrc: getCoinImage('BNB'),
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: '43113',
    label: CHAIN_NAME.Avalanche_Testnet,
    imgSrc: getCoinImage('AVAX'),
    headerName: NETWORK_TYPE.TESTNET,
  },
]

export const NETWORK_L2_OPTIONS = [
  ALL_NETWORKS,
  {
    value: '288',
    label: CHAIN_NAME.Boba_Ethereum,
    imgSrc: bobaEth,
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '56288',
    label: CHAIN_NAME.Boba_BNB,
    imgSrc: bobaBnb,
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '43288',
    label: CHAIN_NAME.Boba_Avalanche,
    imgSrc: bobaAvax,
    headerName: NETWORK_TYPE.MAINNET,
  },
  {
    value: '2888',
    label: CHAIN_NAME.Boba_Goerli,
    imgSrc: bobaEth,
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: '9728',
    label: CHAIN_NAME.Boba_BNB_Testnet,
    imgSrc: bobaBnb,
    headerName: NETWORK_TYPE.TESTNET,
  },
  {
    value: '4328',
    label: CHAIN_NAME.Boba_Avalanche_Testnet,
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
