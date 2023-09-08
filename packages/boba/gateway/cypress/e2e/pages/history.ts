/// <reference types="cypress"/>
import Page from './base/page'
import dayjs from 'dayjs'
import {
  formatDate,
  isSameOrAfterDate,
  isSameOrBeforeDate,
} from '../../../src/util/dates'
import { Layer } from '../../../src/util/constant'
import {
  TRANSACTION_FILTER_STATUS,
  CHAIN_NAME,
} from '../../../src/containers/history/types'
import truncate from 'truncate-middle'

export default class History extends Page {
  fromDate: Date
  toDate: Date
  networkLayerFrom: Layer
  fromNetwork: string
  toNetwork: string
  constructor() {
    super()
    this.toDate = new Date()
    this.fromDate = new Date(
      this.toDate.getFullYear(),
      this.toDate.getMonth() - 6,
      this.toDate.getDate()
    )
    this.id = 'history'
    this.walletConnectButtonText = 'Connect Wallet'
    this.networkLayerFrom = Layer.L1
    this.fromNetwork = 'All Networks'
    this.toNetwork = 'All Networks'
  }
  getSearchInput() {
    return this.withinPage()
      .get('input[placeholder="Search Here"]')
      .should('exist')
  }
  getFromDatePicker() {
    const dateString = formatDate(this.fromDate.getTime() / 1000, 'MM/DD/YYYY')
    return this.withinPage().get('div').contains(dateString).should('exist')
  }
  getToDatePicker() {
    const dateString = formatDate(this.toDate.getTime() / 1000, 'MM/DD/YYYY')
    return this.withinPage().get('div').contains(dateString).should('exist')
  }
  getNetworkDropdowns() {
    return this.withinPage().find('#networkDropdowns')
  }

  getFromNetworkDropdown() {
    return this.getNetworkDropdowns().children().filter('div').first()
  }
  getToNetworkDropdown() {
    return this.getNetworkDropdowns().children().filter('div').last()
  }

  async changeFromNetwork(networkName: string) {
    this.getFromNetworkDropdown()
      .contains(this.fromNetwork)
      .should('exist')
      .click()
    this.getFromNetworkDropdown().contains(networkName).should('exist').click()
    this.fromNetwork = networkName
  }

  changeToNetwork(networkName: string) {
    this.getToNetworkDropdown().contains(this.toNetwork).should('exist').click()
    this.getToNetworkDropdown().contains(networkName).should('exist').click()
    this.toNetwork = networkName
  }
  verifyFilteredTransactionsByColumn(column: string, content: string) {
    this.getTransactionsColumn(column).then((transactionTableColumn) => {
      for (const transactionInfo of transactionTableColumn) {
        cy.wrap(transactionInfo).contains(content).should('exist')
      }
    })
  }

  checkNetworkDropdowns() {
    this.getNetworkDropdowns()
      .find(':contains("All Networks")')
      .not(':has(*)') // checks that elements are leafs in the HTML tree
      .should('not.be.empty')
      .and((networkDropdowns) => {
        const labels = networkDropdowns.map((i, networkDropdown) => {
          return Cypress.$(networkDropdown).text()
        })
        expect(labels.get()).to.deep.eq(['All Networks', 'All Networks'])
      })

    // ensure that network dropdowns are in the correct order by default
    this.getFromNetworkDropdown()
      .invoke('attr', 'id')
      .should('equal', 'L1Networks')
    this.getToNetworkDropdown()
      .invoke('attr', 'id')
      .should('equal', 'L2Networks')

    // properly filters transactions by chosen 'from' network
    this.changeFromNetwork(CHAIN_NAME.Goerli)
    this.verifyFilteredTransactionsByColumn(
      'transactionOriginDetails',
      CHAIN_NAME.Goerli
    )

    this.changeFromNetwork('All Networks')

    // properly filters transactions by chosen 'to' network
    this.changeToNetwork(CHAIN_NAME.Boba_Goerli)
    this.verifyFilteredTransactionsByColumn(
      'transactionDestinationDetails',
      CHAIN_NAME.Boba_Goerli
    )

    // test network switch
    this.switchNetworkDropdowns()
    this.verifyFilteredTransactionsByColumn(
      'transactionOriginDetails',
      CHAIN_NAME.Boba_Goerli
    )

    this.switchNetworkDropdowns()
    this.changeToNetwork('All Networks')
  }

  switchNetworkDropdowns() {
    this.getNetworksSwitchIcon().click()
    const networkHolder = this.fromNetwork
    this.fromNetwork = this.toNetwork
    this.toNetwork = networkHolder
  }

  getNetworksSwitchIcon() {
    return this.withinPage()
      .find('#switchNetworkDirection')
      .should('exist')
      .find('svg')
      .should('exist')
  }

  getStatusFilter() {
    return this.withinPage().find('#statusFilter').should('exist')
  }
  getTransactions() {
    return this.withinPage().get('#transactionList').children()
  }

  waitForTransactionsToLoad() {
    cy.window()
      .its('store')
      .invoke('getState')
      .its('transaction', { timeout: 90000 })
      .should('not.be.empty')
  }

  checkSearchInput() {
    const hash = Cypress.env('target_hash')
    this.getSearchInput().focus().type(hash)
    this.getTransactions().contains(truncate(hash, 4, 4, '...')).should('exist')
    this.getTransactions().should('have.length', 1)
    this.getSearchInput().clear()
  }

  changeDatePicker(from: boolean, targetDate: Date, shouldBeDisabled = false) {
    const originalDate = from ? this.fromDate : this.toDate
    const datePicker = from ? this.getFromDatePicker() : this.getToDatePicker()

    datePicker.click()
    const monthDelta = targetDate.getMonth() - originalDate.getMonth()
    if (monthDelta > 0) {
      for (let i = 0; i < monthDelta; i++) {
        this.withinPage().find('button[aria-label="Go to next month"]').click()
      }
    }
    if (monthDelta < 0) {
      for (let i = 0; i < monthDelta * -1; i++) {
        this.withinPage()
          .find('button[aria-label="Go to previous month"]')
          .click()
      }
    }

    if (shouldBeDisabled) {
      this.withinPage()
        .find('button[name=day]')
        .contains(targetDate.getDate())
        .invoke('attr', 'disabled')
        .should('exist')
    } else {
      this.withinPage()
        .find('button[name=day]')
        .contains(targetDate.getDate())
        .should('have.length', 1)
        .click()
      if (from) {
        this.fromDate = targetDate
      } else {
        this.toDate = targetDate
      }
    }
    datePicker.click()
  }

  verifyTransactionsByDate(fromDate: Date, toDate: Date) {
    this.getTransactionsColumn('transactionDate').then(($date) => {
      const transactionDates = $date.map((i, element) =>
        Cypress.$(element).text()
      )
      for (const transactionDateStr of transactionDates.get()) {
        const transactionTimestamp = dayjs(new Date(transactionDateStr)).unix()
        expect(isSameOrAfterDate(transactionTimestamp, dayjs(fromDate))).to.be
          .true
        expect(isSameOrBeforeDate(transactionTimestamp, dayjs(toDate))).to.be
          .true
      }
    })
  }

  checkDatePickers() {
    const orignalFromDate = this.fromDate
    const orignalToDate = this.toDate
    this.changeDatePicker(true, new Date('30 Jun 2023 12:00 AM'))
    this.changeDatePicker(false, new Date('30 Aug 2023 12:00 AM'))

    // ensure transactions occured within the date specified in the date pickers
    this.verifyTransactionsByDate(this.fromDate, this.toDate)

    // dates after 'to date' should be disabled in 'from' date picker
    this.changeDatePicker(true, new Date('31 Aug 2023 12:00 AM'), true)

    // dates before 'from date' should be disabled in 'to' date picker
    this.changeDatePicker(false, new Date('29 Jun 2023 12:00 AM'), true)

    this.changeDatePicker(true, orignalFromDate)
    this.changeDatePicker(false, orignalToDate)
  }

  changeStatusFilter(status: TRANSACTION_FILTER_STATUS) {
    this.getStatusFilter().find('svg').should('exist').click()
    this.getStatusFilter().contains(status).should('exist').click()
  }

  // gets given column of transactions in the transaction table such as, origin chain, date, status, etc
  getTransactionsColumn(columnName: string) {
    return this.withinPage()
      .find('#transactionList', { timeout: 90 * 1000 })
      .should('exist')
      .find(`div[aria-label=${columnName}]`)
      .should('exist')
  }

  checkStatusFilter() {
    this.changeStatusFilter(TRANSACTION_FILTER_STATUS.Completed)
    this.verifyFilteredTransactionsByColumn(
      'transactionStatus',
      TRANSACTION_FILTER_STATUS.Completed
    )

    this.changeStatusFilter(TRANSACTION_FILTER_STATUS.Pending)
    this.verifyFilteredTransactionsByColumn(
      'transactionStatus',
      TRANSACTION_FILTER_STATUS.Pending
    )

    this.changeStatusFilter(TRANSACTION_FILTER_STATUS.Canceled)
    this.changeStatusFilter(TRANSACTION_FILTER_STATUS.All)
  }

  checkConjunctionOfFilters() {
    const orignalFromDate = this.fromDate

    // use date pickers to filter by date
    this.changeDatePicker(true, new Date('30 Jun 2023 12:00 AM'))

    // use status filter to filter by status
    this.changeStatusFilter(TRANSACTION_FILTER_STATUS.Completed)

    // use network dropdowns to filter by network
    this.changeFromNetwork(CHAIN_NAME.Goerli)

    // verify transactions
    this.verifyTransactionsByDate(this.fromDate, this.toDate)

    this.verifyFilteredTransactionsByColumn(
      'transactionStatus',
      TRANSACTION_FILTER_STATUS.Completed
    )

    this.verifyFilteredTransactionsByColumn(
      'transactionOriginDetails',
      CHAIN_NAME.Goerli
    )

    this.changeDatePicker(true, orignalFromDate)

    this.changeStatusFilter(TRANSACTION_FILTER_STATUS.All)
    this.changeFromNetwork('All Networks')
  }
}
