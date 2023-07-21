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
export enum LAYER {
  L1 = 'L1',
  L2 = 'L2',
}

export interface ITransactionFilter {
  fromNetwork: string
  toNetwork: string
  startDate?: Date
  endDate?: Date
  status?: TRANSACTION_FILTER_STATUS
  targetHash?: string
}

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
  chain: string
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
}
