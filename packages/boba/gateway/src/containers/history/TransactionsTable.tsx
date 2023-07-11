import React from 'react'
import {
  TransactionStatus,
  Transaction,
  TransactionHeader,
} from 'components/updatedTransaction/Transaction'
import { useSelector } from 'react-redux'
import { selectLoading, selectTokens } from 'selectors'

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

export interface ITransactionsTableProps {
  filter: IFilter
  transactions: ITransaction[]
}

export const TransactionsTable: React.FC<ITransactionsTableProps> = ({
  transactions,
  filter,
}) => {
  const tokenList = useSelector(selectTokens)
  const resolveTransaction = (transaction: ITransaction, index: number) => {
    const token = tokenList[transaction.action.token.toLowerCase()]
    return (
      <Transaction
        key={`transaction_${index}`}
        timeStamp={transaction.timeStamp}
        from={transaction.from}
        to={transaction.to}
        decimals={token.decimals}
        token={transaction.action.token}
        amount={transaction.action.amount}
        // status={transaction.action.status}
        status={'Pending' as TransactionStatus}
      ></Transaction>
    )
  }
  return (
    <>
      <div style={{ width: '100%', border: '1px solid #545454' }}>
        <TransactionHeader />
        {transactions &&
          transactions.map((transaction, index) => {
            return resolveTransaction(transaction, index)
          })}
      </div>
    </>
  )
}
