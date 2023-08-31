/// <reference types="cypress"/>
import Page from './base/page'
import { formatDate } from '../../../src/util/dates'

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
    cy.get('input[placeholder="Search Here"]').should('exist')
  }
  getFromDatePicker() {
    const dateString = formatDate(this.fromDate.getTime() / 1000, 'MM/DD/YYYY')
    cy.get('div').contains(dateString).should('exist')
  }
  getToDatePicker() {
    const dateString = formatDate(this.toDate.getTime() / 1000, 'MM/DD/YYYY')
    cy.get('div').contains(dateString).should('exist')
  }
}
