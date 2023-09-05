/// <reference types="cypress"/>
import Page from './base/page'
import dayjs from 'dayjs'
import {
  formatDate,
  isSameOrAfterDate,
  isSameOrBeforeDate,
} from '../../../src/util/dates'

export default class History extends Page {
  fromDate: Date
  toDate: Date
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

  checkNetworkDropdowns() {
    this.withinPage()
      .find("div:contains('All Networks')")
      .not(':has(*)')
      .should('not.be.empty')
      .and(($p) => {
        expect($p).to.have.length(2)
        const labels = $p.map((i, el) => {
          return Cypress.$(el).text()
        })
        expect(labels.get()).to.deep.eq(['All Networks', 'All Networks'])
      })
  }

  getNetworksSwitchIcon() {
    return this.withinPage()
      .get('#switchNetworkDirection')
      .should('exist')
      .get('svg')
      .should('exist')
  }

  getStatusFilter() {
    return this.withinPage()
      .get('#statusFilter')
      .should('exist')
      .get('svg')
      .should('exist')
  }
  getTransactions() {
    return this.withinPage().get('#transactionList').children()
  }

  waitForTransactionsToLoad() {
    cy.window()
      .its('store')
      .invoke('getState')
      .its('transaction', { timeout: 60000 })
      .should('not.be.empty')
  }

  checkSearchInput() {
    this.getSearchInput().type(
      '0x8a5c9043806640273140f0ff4f1730b780024a8220f301550de55cc2652c6e2b'
    )
    this.getTransactions().should('have.length', 1)
    this.getSearchInput().clear()
    this.getTransactions().should('have.length.greaterThan', 1)
  }
  changeDatePicker(from: boolean, targetDate: Date) {
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
  checkDatePickers() {
    const orignalFromDate = this.fromDate
    const orignalToDate = this.toDate
    this.changeDatePicker(true, new Date('30 Jun 2023 12:00 AM'))
    this.changeDatePicker(false, new Date('30 Aug 2023 12:00 AM'))
    this.withinPage()
      .find('div[title="transactionDate"]')
      .then(($date) => {
        const transactionDates = $date.map((i, element) =>
          Cypress.$(element).text()
        )
        for (const transactionDateStr of transactionDates.get()) {
          const transactionTimestamp = dayjs(
            new Date(transactionDateStr)
          ).unix()
          expect(isSameOrAfterDate(transactionTimestamp, dayjs(this.fromDate)))
            .to.be.true
          expect(isSameOrBeforeDate(transactionTimestamp, dayjs(this.toDate)))
            .to.be.true
        }
      })
    this.changeDatePicker(true, orignalFromDate)
    this.changeDatePicker(false, orignalToDate)
  }
}
