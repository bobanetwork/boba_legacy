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
    return cy.get('div[title="light-icon"]').should('exist')
  }

  getDarkThemeSwitcher() {
    return cy.get('div[title="dark-icon"]').should('exist')
  }

  requestMetamaskConnect() {
    cy.get('button[label|="Connect Wallet"]').should('exist').click()
    cy.get('#connectMetaMask').should('exist').click()
  }

  switchNetwork(
    networkName: string,
    networkAbbreviation: string,
    isTestnet: boolean
  ) {
    this.getNetworkSwitcher().click()
    this.getNetworkSwitcher().contains(networkName).should('exist').click()
    cy.wait(500)
    cy.get(
      `button[label="Switch to ${networkAbbreviation} ${
        isTestnet ? 'Testnet' : ''
      } network"]`
    )
      .should('exist')
      .click()
    cy.wait(500)
    cy.get(
      `button[label="Connect to the ${networkAbbreviation} ${
        isTestnet ? 'Testnet' : 'Mainnet'
      } network"]`
    )
      .should('exist')
      .click()
    cy.wait(500)
    this.allowNetworkSwitch()
  }
}
