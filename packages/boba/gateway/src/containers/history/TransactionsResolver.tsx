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

export interface IFilter {
  status: string
  targetHash: string
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
  crossDomainMessageEstimatedFinalizedTime: number
  crossDomainMessageFinalized: number
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
  activity: string
  blockNumber: number
  chain: string
  contractAddress: string
  contractName: string
  crossDomainMessage: ICrossDomainMessage
  depositL2: boolean
  from: string
  hash: string
  timeStamp: number
  to: string
}

export interface ITransactionsResolverProps {
  filter: IFilter
  transactions: ITransaction[]
}

export const TransactionsResolver: React.FC<ITransactionsResolverProps> = ({
  transactions,
  filter,
}) => {
  const tokenFromAddress = useSelector(selectTokens)

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

  const getTransactionAmount = (amount: string) => {
    return <TransactionAmount>{amount}</TransactionAmount>
  }

  return (
    <TransationsTableWrapper>
      <div>
        {transactions.map((transaction, index) => {
          console.log(transaction)
          let amount = ''
          if (transaction.action.token) {
            const token_address = transaction.action.token.toLowerCase()
            const token = tokenFromAddress[token_address]
            amount = logAmount(transaction.action.amount, token?.decimals, 2)
          } else {
            amount = '0.00'
          }

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
                  content: getTransactionAmount(amount),
                  width: 80,
                },
                { content: <Status>Pending</Status>, width: 88 },
              ]}
            />
          )
        })}
      </div>
    </TransationsTableWrapper>
  )
}
