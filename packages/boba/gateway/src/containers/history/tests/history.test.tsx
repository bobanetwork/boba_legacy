import { render, screen } from '@testing-library/react'
import React from 'react'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import { NETWORK, NETWORK_TYPE } from 'util/network/network.util'
import History from '../History'
import { TransactionsResolver } from '../TransactionsResolver'
import {
  ITransactionFilter,
  ITransactionsResolverProps,
  TRANSACTION_FILTER_STATUS,
} from '../types'
const sampleTransactions = require('./sampleTransactions.json')

const mockStore = configureStore()
const TokenList = {
  BOBA: {
    addressL1: '0xeCCD355862591CBB4bB7E7dD55072070ee3d0fC1',
    addressL2: '0x4200000000000000000000000000000000000023',
  },
  ETH: {
    addressL1: '0x0000000000000000000000000000000000000000',
    addressL2: '0x4200000000000000000000000000000000000006',
  },
}
const networkDetails = {
  activeNetworkName: {
    l1: 'Etheruem (Goerli)',
    l2: 'Boba',
  },
  activeNetwork: NETWORK.ETHEREUM,
  activeNetworkType: NETWORK_TYPE.MAINNET,
}

const renderHistory = ({ options = null }: any) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
        network: networkDetails,
        transaction: {
          transaction: sampleTransactions,
        },
        setup: {
          accountEnabled: false,
          netLayer: true,
          baseEnabled: false,
          walletAddress: '0x1e2855A0EA33d5f293E5Ba2018874FAB9a7F05B3',
        },
        tokenList: TokenList,
        ...options,
      })}
    >
      <CustomThemeProvider>
        <History></History>
      </CustomThemeProvider>
    </Provider>
  )
}

const renderTransactionsResolver = (props: ITransactionsResolverProps) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
        network: networkDetails,
        transaction: {
          transaction: sampleTransactions,
        },
        setup: {
          accountEnabled: true,
          netLayer: true,
        },
        tokenList: TokenList,
      })}
    >
      <CustomThemeProvider>
        <TransactionsResolver
          transactions={props.transactions}
          transactionsFilter={props.transactionsFilter}
        />
      </CustomThemeProvider>
    </Provider>
  )
}

describe('Testing history page', () => {
  const filter: ITransactionFilter = {
    fromNetwork: 'Boba',
    toNetwork: 'Etheruem (Goerli)',
    status: TRANSACTION_FILTER_STATUS.All,
    targetHash: '',
  }
  test('Test transaction resolver', () => {
    const { asFragment } = renderTransactionsResolver({
      transactions: sampleTransactions,
      transactionsFilter: filter,
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('Test History Page', () => {
    const { asFragment } = renderHistory({})
    expect(asFragment()).toMatchSnapshot()
  })
})
