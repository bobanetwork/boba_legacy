import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import History from '../History'
import { TransactionsResolver } from '../TransactionsResolver'
import DatePicker, { IDatePickerProps } from '../DatePicker'
import truncate from 'truncate-middle'
import {
  CHAIN_NAME,
  ITransactionFilter,
  ITransactionsResolverProps,
  TRANSACTION_FILTER_STATUS,
} from '../types'
import { formatDate } from 'util/dates'
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
        transaction: {
          transaction: sampleTransactions,
        },
        setup: {
          accountEnabled: true,
          netLayer: true,
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

// changes current selected time to the desired time
const selectDatepickerDate = (originalDate: Date, targetDate: Date) => {
  const monthDelta = targetDate.getMonth() - originalDate.getMonth()
  const originalDateString = formatDate(
    originalDate.getTime() / 1000,
    'MM/DD/YYYY'
  )
  const datePicker = screen.getByText(originalDateString)
  userEvent.click(datePicker)
  if (monthDelta > 0) {
    const nextMonthButton = screen.getByRole('button', {
      name: 'Go to next month',
    })
    for (let i = 0; i < monthDelta; i++) {
      userEvent.click(nextMonthButton)
    }
  }
  if (monthDelta < 0) {
    const previousMonthButton = screen.getByRole('button', {
      name: 'Go to previous month',
    })
    for (let i = 0; i < monthDelta * -1; i++) {
      userEvent.click(previousMonthButton)
    }
  }
  userEvent.click(screen.getByText(`${targetDate.getDate()}`))
}

describe('Testing history page', () => {
  test('Test transaction resolver', () => {
    const allNetworksId = '0'
    const filter: ITransactionFilter = {
      fromNetworkChainId: allNetworksId,
      toNetworkChainId: allNetworksId,
      status: TRANSACTION_FILTER_STATUS.All,
      targetHash: '',
    }
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

describe('History Page Integration Test', () => {
  beforeEach(() => {
    renderHistory({})
  })

  test('History Page Dropdown Networks', async () => {
    const numberOfTransactionsFromGoerli = 5
    const numberOfGoerliToBobaTransactions = 5
    const numberOfBobaToGoerliTransactions = 8
    const numberOfFujiToBobaTransactions = 5

    const networksDropdownContainer = screen.getByTestId('network-dropdowns')
    const networkDropdowns = screen.getAllByText(CHAIN_NAME.All_Networks)
    expect(networkDropdowns.length).toBe(2)
    const fromNetwork = networkDropdowns[0]
    const toNetwork = networkDropdowns[1]

    // switch `From` network to Goerli
    userEvent.click(fromNetwork)
    userEvent.click(
      within(networksDropdownContainer).getByText(CHAIN_NAME.Goerli)
    )

    // count transactions from Goerli
    const transactionsTable = screen.getByTestId('transactions-table')
    const transactionsFromGoerliCount = within(transactionsTable).getAllByText(
      CHAIN_NAME.Goerli
    ).length
    expect(transactionsFromGoerliCount).toBe(numberOfTransactionsFromGoerli)

    // switch `To` network to Boba Goerli
    userEvent.click(toNetwork)
    userEvent.click(
      within(networksDropdownContainer).getByText(CHAIN_NAME.Boba_Goerli)
    )
    const transactionsFromGoerliToBobaCount = within(
      transactionsTable
    ).getAllByText(CHAIN_NAME.Goerli).length

    expect(transactionsFromGoerliToBobaCount).toBe(
      numberOfGoerliToBobaTransactions
    )

    // switch the `To` and `From` fields
    userEvent.click(screen.getByTestId('switch-icon'))

    // count transactions from Boba to Goerli
    const transactionsFromBobaToGoerli = within(transactionsTable).getAllByText(
      CHAIN_NAME.Goerli
    ).length
    // ensure only the correct amount of transactions show
    expect(transactionsFromBobaToGoerli).toBe(numberOfBobaToGoerliTransactions)

    userEvent.click(screen.getByTestId('switch-icon'))

    userEvent.click(fromNetwork)
    userEvent.click(
      within(networksDropdownContainer).getByText(CHAIN_NAME.Avalanche_Testnet)
    )

    userEvent.click(toNetwork)
    userEvent.click(
      within(networksDropdownContainer).getByText(
        CHAIN_NAME.Boba_Avalanche_Testnet
      )
    )

    const transactionsFromFujiToBoba = within(transactionsTable).getAllByText(
      CHAIN_NAME.Avalanche_Testnet
    ).length
    expect(transactionsFromFujiToBoba).toBe(numberOfFujiToBobaTransactions)

    const goerliTransactions = within(transactionsTable).queryAllByText(
      CHAIN_NAME.Goerli
    ).length
    expect(goerliTransactions).toBe(0)
  })

  test('History Page Status Filter', async () => {
    // # pending transactions in sampleTransactions
    const numberOfPendingTransactions = 2
    const numberOfCompletedTransactions = 16

    // select pending option of status filter
    const statusFilterDropdown = screen.getByTestId('status_filter_dropdown')
    const filterDropdownHeader = screen.getByTestId(
      'status_filter_dropdown_header'
    )
    userEvent.click(filterDropdownHeader)

    const pendingStatus = within(statusFilterDropdown).getByText(
      TRANSACTION_FILTER_STATUS.Pending
    )
    userEvent.click(pendingStatus)

    const transactionsTable = screen.getByTestId('transactions-table')
    const pendingTransactionsCount = within(transactionsTable).getAllByText(
      TRANSACTION_FILTER_STATUS.Pending
    ).length

    // select completed option of status filter
    userEvent.click(filterDropdownHeader)
    const completedStatus = within(statusFilterDropdown).getByText(
      TRANSACTION_FILTER_STATUS.Completed
    )
    userEvent.click(completedStatus)

    const completedTransactionCount = within(transactionsTable).getAllByText(
      TRANSACTION_FILTER_STATUS.Completed
    ).length
    // ensure that the number of pending/completed transactions is correct
    expect(pendingTransactionsCount).toBe(numberOfPendingTransactions)
    expect(completedTransactionCount).toBe(numberOfCompletedTransactions)
  })

  test('History Page Search Input', () => {
    const targetHash =
      '0x5a6e65827640f2264e17c6a781ab8eeff4c99a393cb80e5824ac1eb27670a7d9'
    const otherTransactionHash =
      '0x8dcc76215d8e36323d0424b3da50e52624eebe26bb2fc16b748800cbe2d86f74'
    const searchInput = screen.getByPlaceholderText('Search Here')
    fireEvent.change(searchInput, { target: { value: targetHash } })
    const targetTransaction = screen.getByText(
      `Tx: ${truncate(targetHash, 4, 4, '...')}`
    )

    const filteredTransaction = screen.queryByText(
      `Tx: ${truncate(otherTransactionHash, 4, 4, '...')}`
    )

    expect(targetTransaction).toBeTruthy()
    expect(filteredTransaction).toBeNull()
  })

  test('History Page Date Picker', () => {
    // default to date is today's date
    const to = new Date()
    // default from date is 6 months prior to today's date
    const from = new Date(to.getFullYear(), to.getMonth() - 6, to.getDate())
    const targetFrom = new Date(2023, 7, 8)
    const targetTo = new Date(2023, 7, 10)

    // change from date to target date
    selectDatepickerDate(from, targetFrom)

    // change to date to target to date
    selectDatepickerDate(to, targetTo)

    const transactionsTable = screen.getByTestId('transactions-table')
    const completedTransactionsCount = within(transactionsTable).queryAllByText(
      TRANSACTION_FILTER_STATUS.Completed
    ).length
    const pendingTransactionsCount = within(transactionsTable).queryAllByText(
      TRANSACTION_FILTER_STATUS.Pending
    ).length
    const allTransactionsCount =
      completedTransactionsCount + pendingTransactionsCount

    expect(allTransactionsCount).toBe(7)
  })

  test('History Page All Filters', () => {
    const allTransactionsFromBobaGoerli = 8
    const transactionsFromBobaGoerliDateFilter = 5
    const pendingTransactionsFromBobaGoerli = 2

    // Adjust from and to fields
    const networksDropdownContainer = screen.getByTestId('network-dropdowns')
    const networkDropdowns = screen.getAllByText(CHAIN_NAME.All_Networks)
    expect(networkDropdowns.length).toBe(2)
    const fromNetwork = networkDropdowns[0]
    const toNetwork = networkDropdowns[1]

    // switch the to and from fields
    userEvent.click(screen.getByTestId('switch-icon'))

    userEvent.click(fromNetwork)
    userEvent.click(
      within(networksDropdownContainer).getByText(CHAIN_NAME.Boba_Goerli)
    )
    userEvent.click(toNetwork)
    userEvent.click(
      within(networksDropdownContainer).getByText(CHAIN_NAME.Goerli)
    )

    // count transactions from Boba Goerli to Goerli
    const transactionsTable = screen.getByTestId('transactions-table')
    let transactionsFromBobaGoerliCount = within(
      transactionsTable
    ).getAllByText(CHAIN_NAME.Boba_Goerli).length

    expect(transactionsFromBobaGoerliCount).toBe(allTransactionsFromBobaGoerli)

    // adjust date picker field
    const to = new Date()
    const from = new Date(to.getFullYear(), to.getMonth() - 6, to.getDate())
    const targetFrom = new Date(2023, 6, 7)
    const targetTo = new Date(2023, 7, 10)
    // change from date to target date
    selectDatepickerDate(from, targetFrom)
    // change to date to target to date
    selectDatepickerDate(to, targetTo)

    // count transactions from Boba Goerli to Goerli between 07/07/2023 and 08/10/2023
    transactionsFromBobaGoerliCount = within(transactionsTable).getAllByText(
      CHAIN_NAME.Boba_Goerli
    ).length

    expect(transactionsFromBobaGoerliCount).toBe(
      transactionsFromBobaGoerliDateFilter
    )

    // Adjust transaction status filter field
    const statusFilterDropdown = screen.getByTestId('status_filter_dropdown')
    const filterDropdownHeader = screen.getByTestId(
      'status_filter_dropdown_header'
    )
    userEvent.click(filterDropdownHeader)
    const pendingStatus = within(statusFilterDropdown).getByText(
      TRANSACTION_FILTER_STATUS.Pending
    )
    userEvent.click(pendingStatus)

    // Count pending transactions within specified dates
    const pendingTransactionsCount = within(transactionsTable).getAllByText(
      CHAIN_NAME.Boba_Goerli
    ).length

    expect(pendingTransactionsCount).toBe(pendingTransactionsFromBobaGoerli)

    const targetHash =
      '0xcfc49960c3926ff813eb060b7bdb01246c8eb9e9d71523db7daa5dc9b758c56d'
    const otherHash =
      '0x24967eb38ed526d8bcc6d42a40924f75328e9634dd7eab861879b714fd39a0e9'

    const searchInput = screen.getByPlaceholderText('Search Here')
    fireEvent.change(searchInput, { target: { value: targetHash } })
    const targetTransaction = screen.getByText(
      `Tx: ${truncate(targetHash, 4, 4, '...')}`
    )

    const filteredTransaction = screen.queryByText(
      `Tx: ${truncate(otherHash, 4, 4, '...')}`
    )

    expect(targetTransaction).toBeTruthy()
    expect(filteredTransaction).toBeNull()
  })
})
