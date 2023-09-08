import Base from './base'

export default class PageHeader extends Base {
  getNavigationLinks() {
    return cy.get('#header').find('a')
  }

  getNetworkSwitcher() {
    return cy.get('#networkSelector').should('exist')
  }

  getLightThemeSwitcher() {
    return cy.get('div[title="light-icon"]').should('exist')
  }

  getDarkThemeSwitcher() {
    return cy.get('div[title="dark-icon"]').should('exist')
  }

  switchNetwork(networkName: string) {
    this.getNetworkSwitcher().click()
    this.getNetworkSwitcher().contains(networkName).should('exist').click()
  }
  disconnectWallet() {
    cy.get('#header')
      .contains(/^0x[a-fA-F0-9]{4}...[a-fA-F0-9]{4}$/g)
      .should('exist')
      .click()
    cy.get('ul').contains('li', 'Disconnect').should('exist').click()
  }
}
