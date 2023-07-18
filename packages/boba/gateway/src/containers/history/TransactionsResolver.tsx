import {
  TransactionsTableHeader,
  TransactionsTableContent,
} from 'components/global/table/themes'

import { TableHeaderOptionType } from 'components/global/table'
import React, { useState, useEffect } from 'react'
import { L1_ICONS, L2_ICONS } from 'util/network/network.util'
import { getCoinImage } from 'util/coinImage'
import { formatDate, isSameOrAfterDate, isSameOrBeforeDate } from 'util/dates'
import { Dayjs } from 'dayjs'
import {
  Date,
  TransactionAmount,
  Icon,
  Status,
  TransactionChain,
  TransactionChainDetails,
  TransactionToken,
  TransationsTableWrapper,
  TransactionHash,
  IconContainer,
} from './styles'
import { useSelector } from 'react-redux'
import { orderBy } from 'util/lodash'
import {
  selectLoading,
  selectTokens,
  selectActiveNetworkIcon,
  selectActiveNetworkName,
} from 'selectors'
import truncate from 'truncate-middle'
import EthereumIcon from '../../images/ethereum.svg'
import { logAmount } from 'util/amountConvert'
import networkService from 'services/networkService'
import { maxWidth } from '@mui/system'

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
  startDate?: Dayjs
  endDate?: Dayjs
  fromToNetwork?: string
  status?: string
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
  l2BlockHash: string
  l2BlockNumber: number
  l2From: string
  l2Hash: string
  l2To: string
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

export const TransactionsResolver: React.FC<ITransactionsResolverProps> = ({
  transactions,
  transactionsFilter,
}) => {
  const [currentTransactions, setCurrentTransactions] = useState<
    ITransaction[]
  >([])
  console.log(transactions)
  useEffect(() => {
    setCurrentTransactions(transactions)
  }, [transactions])

  const icon = useSelector(selectActiveNetworkIcon())
  const activeNetworks = useSelector(selectActiveNetworkName())
  const orderedTransactions = orderBy(
    currentTransactions,
    (i) => i.timeStamp,
    'desc'
  )

  const getNetworkExplorerLink = (chain: string, hash: string) => {
    const network = networkService.networkConfig
    if (!!network && !!network[chain]) {
      return `${network[chain].transaction}${hash}`
    }
    return ''
  }

  const dateFilter = (transaction: ITransaction) => {
    const txnAfterStartDate = transactionsFilter.startDate
      ? isSameOrAfterDate(transaction.timeStamp, transactionsFilter.startDate)
      : true
    const txnBeforeEndDate = transactionsFilter.endDate
      ? isSameOrBeforeDate(transaction.timeStamp, transactionsFilter.endDate)
      : true

    return txnAfterStartDate && txnBeforeEndDate
  }

  // should filter out transctions that aren't cross domain
  const crossDomainFilter = (transaction: ITransaction) => {
    return (
      transaction.crossDomainMessage &&
      transaction.crossDomainMessage.crossDomainMessage
    )
  }

  // filter transactions by direction
  const networkFilter = (transaction: ITransaction) => {
    let targetFromNetwork = false
    let targetToNetwork = false
    switch (transactionsFilter.fromNetwork) {
      case 'All': {
        targetFromNetwork = true
        break
      }
      // deposit
      case activeNetworks.l1: {
        targetFromNetwork = transaction.depositL2
          ? transaction.depositL2
          : false
        break
      }

      // exit
      case activeNetworks.l2: {
        targetFromNetwork = transaction.exitL2 ? transaction.exitL2 : false
        break
      }
    }
    switch (transactionsFilter.toNetwork) {
      case 'All': {
        targetToNetwork = true
        break
      }
      case activeNetworks.l1: {
        targetToNetwork = transaction.exitL2 ? transaction.exitL2 : false
        break
      }
      case activeNetworks.l2: {
        targetToNetwork = transaction.depositL2 ? transaction.depositL2 : false
        break
      }
    }
    return targetFromNetwork && targetToNetwork
  }
  const getTransactionStatus = (transaction: ITransaction) => {
    if (
      transaction.action &&
      transaction.crossDomainMessage.crossDomainMessageSendTime
    ) {
      switch (transaction.action.status) {
        case TRANSACTION_STATUS.Succeeded: {
          return TRANSACTION_FILTER_STATUS.Completed
        }
        case TRANSACTION_STATUS.Pending: {
          return TRANSACTION_FILTER_STATUS.Pending
        }
      }
    }
    return TRANSACTION_FILTER_STATUS.Canceled
  }
  const statusFilter = (transaction: ITransaction) => {
    // filter out transactions whose status does not match
    const status = getTransactionStatus(transaction)
    transaction.UserFacingStatus = status
    if (
      transactionsFilter.status &&
      transactionsFilter.status !== TRANSACTION_FILTER_STATUS.All
    ) {
      return transactionsFilter.status === transaction.UserFacingStatus
    }

    return true
  }

  // filter out transactions whose hash does not match
  const hashFilter = (transaction: ITransaction) => {
    if (
      transactionsFilter.targetHash &&
      !transaction.hash.includes(transactionsFilter.targetHash)
    ) {
      return false
    }
    return true
  }
  const filteredTransactions = orderedTransactions.filter((transaction) => {
    return (
      crossDomainFilter(transaction) &&
      networkFilter(transaction) &&
      statusFilter(transaction) &&
      dateFilter(transaction) &&
      hashFilter(transaction)
    )
  })

  const tokenFromAddress = useSelector(selectTokens)

  const getTransactionToken = (symbol: string) => {
    return (
      <TransactionToken>
        <Icon src={getCoinImage(symbol)} alt={symbol} />
        <div>{symbol}</div>
      </TransactionToken>
    )
  }

  const getTransactionChain = (layer: LAYER, hash: string) => {
    let networkName = layer === LAYER.L1 ? activeNetworks.l1 : activeNetworks.l2
    networkName = networkName.split(' ')[0]
    const linkToHash = getNetworkExplorerLink(layer, hash)
    // href={chainLink({ chain: prefix, hash: detail.hash })}

    return (
      <TransactionChain>
        <IconContainer>
          {layer === LAYER.L1
            ? L1_ICONS[icon as keyof typeof L1_ICONS]({ selected: true })
            : L2_ICONS[icon as keyof typeof L2_ICONS]({ selected: true })}
        </IconContainer>
        <TransactionChainDetails>
          <div style={{ width: '102px', height: '16px' }}>{networkName}</div>
          <TransactionHash
            href={linkToHash}
            target={'_blank'}
            rel="noopener noreferrer"
            style={{ fontSize: '12px' }}
          >
            {`TX: ${truncate(hash, 4, 4, '...')}`}
          </TransactionHash>
        </TransactionChainDetails>
      </TransactionChain>
    )
  }

  const getTransactionDate = (timeStamp: number) => {
    return <Date>{formatDate(timeStamp, 'DD MMM YYYY hh:mm A')}</Date>
  }

  // const chainResolver = (name: string, layer: LAYER) => {

  // }

  const getTransactionAmount = (amount: string) => {
    return amount ? (
      <TransactionAmount>{amount}</TransactionAmount>
    ) : (
      <TransactionAmount>Not Available</TransactionAmount>
    )
  }

  const process_transaction = (transaction: ITransaction) => {
    let amountString = ''
    const chain = transaction.chain === 'L1pending' ? 'L1' : transaction.chain
    let token = tokenFromAddress[transaction.action.token.toLowerCase()]
    if (chain === 'L2' && !token) {
      token = Object.values(tokenFromAddress).find(
        (t: any) =>
          t.addressL2.toLowerCase() === transaction.action.token.toLowerCase()
      )
    }
    const symbol = token[`symbol${chain}`]

    amountString = logAmount(transaction.action.amount, token?.decimals, 4)

    const processedTransaction: IProcessedTransaction = {
      timeStamp: transaction.timeStamp,
      from: transaction.from,
      fromLayer: transaction.depositL2 ? LAYER.L1 : LAYER.L2,
      to: transaction.to,
      toLayer: transaction.depositL2 ? LAYER.L2 : LAYER.L1,
      tokenSymbol: symbol,
      amount: amountString,
      status: transaction.UserFacingStatus,
      l1Hash: '',
      l2Hash: '',
    }
    return processedTransaction
  }

  const processedTransactions = filteredTransactions.map((transaction) => {
    return process_transaction(transaction)
  })

  return (
    <TransationsTableWrapper>
      {processedTransactions.map(
        (transaction: IProcessedTransaction, index) => {
          return (
            <TransactionsTableContent
              key={`transaction_${index}`}
              options={[
                {
                  content: getTransactionDate(transaction.timeStamp),
                  width: 168,
                },
                {
                  content: getTransactionChain(
                    transaction.fromLayer,
                    transaction.from
                  ),
                  width: 142,
                },
                {
                  content: getTransactionChain(
                    transaction.toLayer,
                    transaction.to
                  ),
                  width: 142,
                },
                {
                  content: getTransactionToken(transaction.tokenSymbol),
                  width: 90,
                },
                {
                  content: getTransactionAmount(transaction.amount),
                  width: 80,
                },
                {
                  content: <Status>{transaction.status}</Status>,
                  width: 88,
                },
              ]}
            />
          )
        }
      )}
    </TransationsTableWrapper>
  )
}
