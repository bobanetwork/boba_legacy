import Base from './base'

export default class PageHeader extends Base {
  constructor() {
    super()
  }

  getNavigationLinks() {
    return cy.get('#header').find('a')
  }

  getNetworkSwitcher() {
    return cy.get('#networkSelector').should('exist')
  }

  getLightThemeSwitcher() {
    return cy.get('div[title="light-icon"]')
  }

  getDarkThemeSwitcher() {
    return cy.get('div[title="dark-icon"]')
  }

  requestMetamaskConnect() {
    cy.get('button[label|="Connect Wallet"]').should('exist').click()
    cy.get('#connectMetaMask').should('exist').click()
  }
}
