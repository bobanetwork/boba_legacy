import React from 'react'
import {
  TransactionsTableHeader,
  TransactionsTableContent,
} from 'components/global/table/themes'

import { TableHeaderOptionType } from 'components/global/table'
import { formatDate } from 'util/dates'
import {
  Date,
  TransactionAmount,
  Icon,
  Status,
  TransactionChain,
  TransactionChainDetails,
  TransactionToken,
  TransationsTableWrapper,
  TransactionContractAdress,
} from './styles'
import { useSelector } from 'react-redux'
import { selectLoading, selectTokens } from 'selectors'
import truncate from 'truncate-middle'
import EthereumIcon from '../../images/ethereum.svg'
import { logAmount } from 'util/amountConvert'
import { maxWidth } from '@mui/system'
import { getCoinImage } from 'util/coinImage'

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
  networks: INetworks
  fromNetwork: string
  toNetwork: string
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

export interface IChain {
  symbol: string
  imgSrc: string
  layer: LAYER
}

export interface IProcessedTransaction {
  date: number
  from: string
  fromChain: IChain
  to: string
  toChain: IChain
  tokenSymbol: string
  amount: string
  status?: TRANSACTION_FILTER_STATUS // need to remove the undefined option
}

export interface ITransactionsResolverProps {
  transactionsFilter: ITransactionFilter
  transactions: ITransaction[]
}

export const TransactionsResolver: React.FC<ITransactionsResolverProps> = ({
  transactions,
  transactionsFilter,
}) => {
  console.log(transactionsFilter.networks)

  // should filter out transctions that aren't cross domain
  const crossDomainFilter = (transaction: ITransaction) => {
    return (
      transaction.crossDomainMessage &&
      transaction.crossDomainMessage.crossDomainMessage
    )
  }

  // filter transactions by direction
  const networkFilter = (transaction: ITransaction) => {
    switch (transactionsFilter.fromNetwork) {
      case 'All': {
        return true
      }
      // deposit
      case transactionsFilter.networks.l1: {
        return transaction.depositL2
      }
      // exit
      case transactionsFilter.networks.l2: {
        return transaction.exitL2
      }
    }
    return false
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
      console.log('transaction status', transaction.UserFacingStatus)
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

  const filteredTransactions = transactions.filter((transaction) => {
    return (
      crossDomainFilter(transaction) &&
      networkFilter(transaction) &&
      statusFilter(transaction) &&
      hashFilter(transaction)
    )
  })

  console.log('filtered transactions: ', filteredTransactions)

  const tokenFromAddress = useSelector(selectTokens)
  console.log('supported tokens', tokenFromAddress)

  const getTransactionToken = (imgSrc: string, symbol: string) => {
    return (
      <TransactionToken>
        <Icon src={imgSrc} alt={'ETH'} />
        <div>{symbol}</div>
      </TransactionToken>
    )
  }

  const getTransactionChain = (
    imgSrc: string,
    symbol: string,
    contractAddress: string
  ) => {
    return (
      <TransactionChain>
        <Icon src={imgSrc} alt={symbol} />
        <TransactionChainDetails>
          <div>{symbol}</div>
          <TransactionContractAdress style={{ fontSize: '12px' }}>
            {truncate(contractAddress, 4, 4, '...')}
          </TransactionContractAdress>
        </TransactionChainDetails>
      </TransactionChain>
    )
  }

  const getTransactionDate = (timeStamp: number) => {
    return <Date>{formatDate(timeStamp, 'DD MMM YYYY hh:mm A')}</Date>
  }

  // const chainResolver = (name: string, layer: LAYER) => {}

  const getTransactionAmount = (transaction: ITransaction) => {
    let amount = ''
    if (transaction.action.token) {
      if (
        transaction.action.token ===
        '0x4200000000000000000000000000000000000006'
      ) {
        amount = logAmount(transaction.action.amount, 18, 4)
        console.log(amount)
      } else {
        const chain =
          transaction.chain === 'L1pending' ? 'L1' : transaction.chain
        let token = tokenFromAddress[transaction.action.token.toLowerCase()]
        if (chain === 'L2' && !token) {
          token = Object.values(tokenFromAddress).find(
            (t: any) =>
              t.addressL2.toLowerCase() ===
              transaction.action.token.toLowerCase()
          )
        }
        const symbol = token[`symbol${chain}`]
        amount = logAmount(transaction.action.amount, token?.decimals, 4)
      }
    }
    return amount ? (
      <TransactionAmount>{amount}</TransactionAmount>
    ) : (
      <TransactionAmount>Not Available</TransactionAmount>
    )
  }

  // const process_transaction = (transaction: ITransaction) => {
  //   let amount = ''
  //   const chain = transaction.chain === 'L1pending' ? 'L1' : transaction.chain
  //   let token = tokenFromAddress[transaction.action.token.toLowerCase()]
  //   if (chain === 'L2' && !token) {
  //     token = Object.values(tokenFromAddress).find(
  //       (t: any) =>
  //         t.addressL2.toLowerCase() === transaction.action.token.toLowerCase()
  //     )
  //   }
  //   let symbol = token[`symbol${chain}`]

  //   amount = logAmount(transaction.action.amount, token?.decimals, 4)

  //   const processedTransaction: IProcessedTransaction = {
  //     date: transaction.timeStamp,
  //     from: transaction.from,
  //     fromChain: '',
  //     to: transaction.to,
  //     toChain: '',
  //     tokenSymbol: symbol,
  //     amount: amount,
  //     status: transaction.UserFacingStatus,
  //   }
  // }

  return (
    <TransationsTableWrapper>
      <div>
        {filteredTransactions.map((transaction, index) => {
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
                    EthereumIcon,
                    'ETH',
                    transaction.from
                  ),
                  width: 142,
                },
                {
                  content: getTransactionChain(
                    EthereumIcon,
                    'ETH',
                    transaction.to
                  ),
                  width: 142,
                },
                {
                  content: getTransactionToken(EthereumIcon, 'ETH'),
                  width: 90,
                },
                {
                  content: getTransactionAmount(transaction),
                  width: 80,
                },
                {
                  content: <Status>{transaction.UserFacingStatus}</Status>,
                  width: 88,
                },
              ]}
            />
          )
        })}
      </div>
    </TransationsTableWrapper>
  )
}
