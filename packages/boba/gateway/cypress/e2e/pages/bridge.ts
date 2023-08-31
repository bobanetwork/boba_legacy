/// <reference types="cypress"/>
import Page from './base/page'

export default class Bridge extends Page {
  constructor() {
    super()
    this.id = 'bridge'
    this.walletConnectButtonText = 'Connect Wallet'
  }
  switchToTestnet() {
    cy.get('#settings').should('exist').click()
    cy.get('label[title="testnetSwitch"]').click()
    cy.get('button[label="Switch to ETHEREUM Testnet network"]').click()
    cy.get('button[label="Connect to the ETHEREUM Testnet network"]').click()
    this.allowNetworkSwitch()
  }

  selectToken(tokenName: string) {
    cy.contains('Select').should('exist').click()
    cy.contains(tokenName).should('exist').click()
  }

  bridgeToken(tokenName: string, amount: string) {
    this.selectToken(tokenName)
    cy.get('input[placeholder="Amount to bridge to L2"]')
      .should('exist')
      .type(`${amount}`)
    cy.get('button').contains('Bridge').should('exist').click()
    cy.contains(`${amount} ETH`).should('exist')
    cy.get('button').contains('Confirm').should('exist').click()
    this.confirmTransaction()
    cy.contains('Estimated time to complete :').should('exist')
  }
}
