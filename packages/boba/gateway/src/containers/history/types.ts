export enum TRANSACTION_FILTER_STATUS {
  Pending = 'Pending',
  Completed = 'Completed',
  Canceled = 'Canceled',
  All = 'All',
}

export enum TRANSACTION_STATUS {
  Succeeded = 'succeeded',
  Pending = 'pending',
  Failed = 'failed',
}

export interface INetworks {
  l1: string
  l2: string
}

export enum CHAIN_NAME {
  All_Networks = 'All Networks',
  BNB_Testnet = 'BNB Testnet',
  Boba_BNB_Testnet = 'Boba BNB Testnet',
  BNB = 'Binance Smart Chain Mainnet',
  Boba_BNB = 'Boba BNB Mainnet',
  Ethereum = 'Mainnet',
  Boba_Ethereum = 'BOBA L2',
  Goerli = 'Goerli',
  Boba_Goerli = 'BOBA Goerli L2',
}

export enum LAYER {
  L1 = 'L1',
  L2 = 'L2',
}

export interface ITransactionFilter {
  fromNetworkChainId: string
  toNetworkChainId: string
  startDate?: Date
  endDate?: Date
  status?: TRANSACTION_FILTER_STATUS
  targetHash?: string
}

// why would we need to access the parent id of a chain
// transactionTo's id is the parentID of the transaction
// transactionFrom's parentID is the chainID of the transaction
export interface IAction {
  amount: string
  fast: number
  feeRate: string
  receive: string
  sender: string
  status: string
  to: string
  token: string
}

export interface ICrossDomainMessage {
  crossDomainMessage: number
  crossDomainMessageEstimateFinalizedTime: number
  crossDomainMessageFinalize: number
  crossDomainMessageSendTime: number
  fast: number
  l2BlockHash?: string
  l2BlockNumber?: number
  l2From?: string
  l2Hash?: string
  l2To?: string
  l1BlockHash?: string
  l1BlockNumber?: number
  l1From?: string
  l1Hash?: string
  l1To?: string
}

export interface ITransaction {
  action: IAction
  activity?: string
  blockNumber: number
  layer: string
  originChainId: number
  destinationChainId: number
  contractAddress: string
  contractName: string
  crossDomainMessage: ICrossDomainMessage
  depositL2?: boolean
  exitL2?: boolean
  from: string
  hash: string
  timeStamp: number
  to: string
  UserFacingStatus?: TRANSACTION_FILTER_STATUS
}

export interface IProcessedTransaction {
  timeStamp: number
  from: string
  fromLayer: LAYER
  to: string
  toLayer: LAYER
  tokenSymbol: string
  amount: string
  status?: TRANSACTION_FILTER_STATUS // need to remove the undefined option
  l1Hash: string
  l2Hash: string
}

export interface ITransactionsResolverProps {
  transactionsFilter: ITransactionFilter
  transactions: ITransaction[]
  loading?: boolean
}

export type ChainMap = {
  [key in CHAIN_NAME]: ChainInfo
}

export type ChainInfo = {
  chainId: string
  parentChainId?: string
  layer: string
}

export interface Token {
  name: string
  symbol: string
  decimals: number
}

export type TokenInfoMap = {
  [key: string]: { [key: string]: Token }
}
