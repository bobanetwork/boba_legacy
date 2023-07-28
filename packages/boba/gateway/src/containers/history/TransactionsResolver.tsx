import { TransactionsTableContent } from 'components/global/table/themes'
import dayjs, { Dayjs } from 'dayjs'
import React, { useState, useEffect } from 'react'
import { getCoinImage } from 'util/coinImage'
import { formatDate, isSameOrAfterDate, isSameOrBeforeDate } from 'util/dates'
import { Chains } from './constants'
import { Svg } from 'components/global/svg'
import { TokenInfo } from 'containers/history/tokenInfo'

import {
  TransactionDate,
  TransactionAmount,
  Icon,
  Status,
  NoHistory,
  TransactionDetails,
  TransactionChainDetails,
  TransactionToken,
  TransactionsWrapper,
  TransactionHash,
  TransactionChain,
  IconContainer,
} from './styles'
import {
  ITransactionsResolverProps,
  ITransaction,
  IProcessedTransaction,
  TRANSACTION_STATUS,
  TRANSACTION_FILTER_STATUS,
  LAYER,
  CHAIN_NAME,
} from './types'
import { useSelector } from 'react-redux'
import { orderBy } from 'util/lodash'
import { selectTokens, selectActiveNetworkName } from 'selectors'
import truncate from 'truncate-middle'
import { logAmount } from 'util/amountConvert'
import networkService from 'services/networkService'
import noHistoryIcon from '../../images/noHistory.svg'

const NetworkNameToSymbol: { [key: string]: string } = {
  ethereum: 'ETH',
  boba: 'BOBA',
  bnb: 'BNB',
}

export const GetSymbolFromNetworkName = (networkName: string): string => {
  const networks: string[] = Object.keys(NetworkNameToSymbol)
  for (const network of networks) {
    if (networkName.toLowerCase().includes(network)) {
      return NetworkNameToSymbol[network]
    }
  }
  return 'N/A'
}

export const TransactionsResolver: React.FC<ITransactionsResolverProps> = ({
  transactions,
  transactionsFilter,
  loading = false,
}) => {
  const [currentTransactions, setCurrentTransactions] = useState<
    ITransaction[]
  >([])

  useEffect(() => {
    setCurrentTransactions(transactions)
  }, [transactions])

  const activeNetworks = useSelector(selectActiveNetworkName())
  const tokenFromAddress = useSelector(selectTokens)
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
      ? isSameOrAfterDate(
          transaction.timeStamp,
          dayjs(transactionsFilter.startDate)
        )
      : true
    const txnBeforeEndDate = transactionsFilter.endDate
      ? isSameOrBeforeDate(
          transaction.timeStamp,
          dayjs(transactionsFilter.endDate)
        )
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

  const networkFilter = (transaction: ITransaction) => {
    let targetFromNetwork = false
    let targetToNetwork = false
    switch (transactionsFilter.fromNetworkChainId) {
      case Chains[CHAIN_NAME.All_Networks].chainId: {
        targetFromNetwork = true
        break
      }
      case transaction.originChainId.toString(): {
        targetFromNetwork = true
        break
      }
    }
    switch (transactionsFilter.toNetworkChainId) {
      case Chains[CHAIN_NAME.All_Networks].chainId: {
        targetToNetwork = true
        break
      }
      case transaction.destinationChainId.toString(): {
        targetToNetwork = true
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
  const hashFilter = (transaction: IProcessedTransaction) => {
    if (transactionsFilter.targetHash) {
      if (
        !transaction.l1Hash.includes(transactionsFilter.targetHash) &&
        !transaction.l2Hash.includes(transactionsFilter.targetHash)
      ) {
        return false
      }
    }
    return true
  }
  const filteredTransactions = orderedTransactions.filter((transaction) => {
    return (
      crossDomainFilter(transaction) &&
      networkFilter(transaction) &&
      statusFilter(transaction) &&
      dateFilter(transaction)
    )
  })

  const process_transaction = (transaction: ITransaction) => {
    let amountString = ''
    const chain = transaction.layer === 'L1pending' ? 'L1' : transaction.layer
    const token =
      TokenInfo[transaction.originChainId.toString()][
        transaction.action.token.toLowerCase()
      ]
    console.log(transaction.originChainId.toString())
    console.log(transaction.action.token.toLowerCase())

    const symbol = token.symbol

    amountString = logAmount(transaction.action.amount, token.decimals, 4)
    let transactionL1Hash = ''
    let transactionL2Hash = ''
    if (chain === LAYER.L2) {
      transactionL2Hash = transaction.hash
      transactionL1Hash = transaction.crossDomainMessage.l1Hash
        ? transaction.crossDomainMessage.l1Hash
        : 'n/a'
    } else if (chain === LAYER.L1) {
      transactionL1Hash = transaction.hash
      transactionL2Hash = transaction.crossDomainMessage.l2Hash
        ? transaction.crossDomainMessage.l2Hash
        : 'n/a'
    }
    const processedTransaction: IProcessedTransaction = {
      timeStamp: transaction.timeStamp,
      from: transaction.from,
      fromLayer: chain as LAYER,
      to: transaction.to,
      toLayer: (chain as LAYER) === LAYER.L1 ? LAYER.L2 : LAYER.L1,
      tokenSymbol: symbol,
      amount: amountString,
      status: transaction.UserFacingStatus,
      l1Hash: transactionL1Hash,
      l2Hash: transactionL2Hash,
    }
    return processedTransaction
  }

  const processedTransactions = filteredTransactions.map((transaction) => {
    return process_transaction(transaction)
  })

  const filteredProcessedTransactions = processedTransactions.filter(
    (transaction) => {
      return hashFilter(transaction)
    }
  )

  const getTransactionToken = (symbol: string) => {
    return (
      <TransactionToken>
        <IconContainer>{<Icon src={getCoinImage(symbol)} />}</IconContainer>
        <div>{symbol}</div>
      </TransactionToken>
    )
  }

  const getTransactionChain = (layer: LAYER, hash: string) => {
    let networkName = layer === LAYER.L1 ? activeNetworks.l1 : activeNetworks.l2
    networkName = networkName.split(' ')[0]
    const linkToHash = getNetworkExplorerLink(layer, hash)
    const symbol = GetSymbolFromNetworkName(networkName)
    // href={chainLink({ chain: prefix, hash: detail.hash })}

    return (
      <TransactionDetails>
        <IconContainer>{<Icon src={getCoinImage(symbol)} />}</IconContainer>
        <TransactionChainDetails>
          <TransactionChain>{networkName}</TransactionChain>
          <TransactionHash
            href={linkToHash}
            target={'_blank'}
            rel="noopener noreferrer"
          >
            {`Tx: ${truncate(hash, 4, 4, '...')}`}
          </TransactionHash>
        </TransactionChainDetails>
      </TransactionDetails>
    )
  }

  const getTransactionDate = (timeStamp: number) => {
    return (
      <TransactionDate>
        {formatDate(timeStamp, 'DD MMM YYYY hh:mm A')}
      </TransactionDate>
    )
  }

  const getTransactionAmount = (amount: string) => {
    return amount ? (
      <TransactionAmount>{amount}</TransactionAmount>
    ) : (
      <TransactionAmount>Not Available</TransactionAmount>
    )
  }
  console.log('filtered transactions', filteredProcessedTransactions)
  return (
    <>
      {transactions.length === 0 && (
        <NoHistory
          style={{ marginLeft: 'auto', marginRight: 'auto', padding: '20px' }}
        >
          <Svg src={noHistoryIcon} />
          <div>Transactions Loading...</div>
        </NoHistory>
      )}
      {filteredProcessedTransactions && (
        <TransactionsWrapper>
          {filteredProcessedTransactions.map(
            (transaction: IProcessedTransaction, index) => {
              return (
                <TransactionsTableContent
                  key={`transaction-${index}`}
                  options={[
                    {
                      content: getTransactionDate(transaction.timeStamp),
                      width: 168,
                    },
                    {
                      content: getTransactionChain(
                        transaction.fromLayer,
                        transaction.fromLayer === LAYER.L1
                          ? transaction.l1Hash
                          : transaction.l2Hash
                      ),
                      width: 142,
                    },
                    {
                      content: getTransactionChain(
                        transaction.toLayer,
                        transaction.toLayer === LAYER.L1
                          ? transaction.l1Hash
                          : transaction.l2Hash
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
        </TransactionsWrapper>
      )}

      {filteredProcessedTransactions.length === 0 &&
        transactions.length !== 0 &&
        !loading && (
          <NoHistory
            style={{ marginLeft: 'auto', marginRight: 'auto', padding: '20px' }}
          >
            <Svg src={noHistoryIcon} />
            <div>No Transactions Matching Filter.</div>
          </NoHistory>
        )}
    </>
  )
}
