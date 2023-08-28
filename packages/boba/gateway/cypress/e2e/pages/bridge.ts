/// <reference types="cypress"/>
import Page from './base/page'

export default class Bridge extends Page {
  constructor() {
    super()
  }
  switchToTestnet() {
    cy.get('#settings').should('exist').click()
    cy.get('input[arial-label="testnetSwitch"]').check()
    cy.get('button[label="Switch to ETHEREUM Testnet network"]').click()
    cy.allowMetamaskToSwitchNetwork().click()
  }
}
