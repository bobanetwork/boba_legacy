import { render, screen } from '@testing-library/react'
import React from 'react'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import History from '../History'
import { TransactionsResolver } from '../TransactionsResolver'
import DatePicker, { IDatePickerProps } from '../DatePicker'
import {
  CHAIN_NAME,
  ITransactionFilter,
  ITransactionsResolverProps,
  TRANSACTION_FILTER_STATUS,
} from '../types'
const sampleTransactions = require('./sampleTransactions.json')

const mockStore = configureStore()

const renderHistory = ({ options = null }: any) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
        transaction: sampleTransactions,
        setup: {
          accountEnabled: false,
          netLayer: true,
          baseEnabled: false,
          walletAddress: '0x1e2855A0EA33d5f293E5Ba2018874FAB9a7F05B3',
        },
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

const renderDatePicker = (props: IDatePickerProps) => {
  return render(
    <DatePicker selected={props.selected} onChange={props.onChange} />
  )
}

describe('Testing history page', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date(2023, 7, 24))
  })
  afterAll(() => {
    jest.useRealTimers()
  })

  const filter: ITransactionFilter = {
    fromNetworkChainId: CHAIN_NAME.Boba_Goerli,
    toNetworkChainId: CHAIN_NAME.Goerli,
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

  test('Date Picker', () => {
    const { asFragment } = renderDatePicker({
      selected: new Date(1970, 4, 10),
      onChange: (date: Date) => console.log(date),
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
