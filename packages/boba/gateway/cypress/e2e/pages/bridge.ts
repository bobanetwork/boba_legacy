/// <reference types="cypress"/>
import Page from './base/page'
import { Layer } from '../../../src/util/constant'

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
    cy.window()
      .its('store')
      .invoke('getState')
      .its('network')
      .its('activeNetworkType')
      .should('equal', 'Testnet')
  }
  switchBridgeDirection(newOriginLayer: Layer) {
    this.withinPage().find('#switchBridgeDirection').should('exist').click()
    this.allowNetworkToBeAddedAndSwitchedTo()
    cy.window()
      .its('store')
      .invoke('getState')
      .its('setup')
      .its('netLayer')
      .should('equal', newOriginLayer)
  }

  selectToken(tokenSymbol: string) {
    this.withinPage().contains('Select').should('exist').click()

    // cy.get('svg[data-testid="AddCircleOutlineOutlinedIcon"]')
    //   .should('exist')
    //   .each(($p) => {
    //     cy.wrap($p).click()
    //     cy.confirmMetamaskAddToken()
    //   })
    cy.get('div[title="tokenList"]')
      .contains(tokenSymbol)
      .should('exist')
      .click()

    // ensure store has correct values
    cy.window()
      .its('store')
      .invoke('getState')
      .its('bridge')
      .its('tokens')
      .its(0)
      .should('exist')
      .its('symbol')
      .should('equal', tokenSymbol)

    // ensure img has loaded before typing in amount
    this.withinPage()
      .get('#tokenSelectorInput')
      .find('img[alt="ETH logo"]')
      .should('be.visible')
      .and('have.prop', 'naturalWidth')
      .should('be.greaterThan', 0)
  }

  bridgeToken(tokenSymbol: string, amount: string, destinationLayer: Layer) {
    const closeIconSrc = new RegExp('^.*close.*.svg$')
    this.selectToken(tokenSymbol)
    if (destinationLayer === Layer.L1) {
      cy.window()
        .its('store')
        .invoke('getState')
        .its('setup')
        .its('bobaFeePriceRatio')
        .should('not.be.empty')

      cy.window()
        .its('store')
        .invoke('getState')
        .its('balance')
        .its('exitFee')
        .should('not.be.empty')
    }

    cy.get(`input[placeholder="Amount to bridge to ${destinationLayer}"]`)
      .should('exist')
      .focus()
      .type(`${amount}`)

    cy.window()
      .its('store')
      .invoke('getState')
      .its('bridge')
      .its('amountToBridge')
      .should('equal', amount)

    cy.get('button').contains('Bridge').should('exist').click()
    cy.contains(`${amount} ETH`, { timeout: 60000 }).should('exist')
    cy.get('button').contains('Confirm').should('exist').click()
    if (destinationLayer === Layer.L1) {
      cy.confirmMetamaskPermissionToSpend()
    }
    this.confirmTransactionOnMetamask()
    if (destinationLayer === Layer.L2) {
      this.getModal().contains('Estimated time to complete :').should('exist')
    } else {
      this.getModal()
        .contains('Your funds will arrive in 7 days at your wallet on')
        .should('exist')
    }
    this.getModal()
      .find('svg')
      .filter((i, element) => {
        const svgDataSource = Cypress.$(element).attr('data-src')
        if (svgDataSource && closeIconSrc.test(svgDataSource)) {
          return true
        }
        return false
      })
      .should('have.length', 1)
      .click()
  }
}
