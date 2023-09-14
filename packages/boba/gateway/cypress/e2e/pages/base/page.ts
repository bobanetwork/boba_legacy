/// <reference types="cypress"/>
import Base from './base'
import PageHeader from './page.header'
import PageFooter from './page.footer'

export default class Page extends Base {
  header: PageHeader
  footer: PageFooter
  walletConnectButtonText: string
  id: string
  constructor() {
    super()
    this.header = new PageHeader()
    this.footer = new PageFooter()
    this.id = 'header'
    this.walletConnectButtonText = 'Connect Wallet'
  }

  visit() {
    cy.visit(`/${this.id}`)
  }
  withinPage() {
    return cy.get(`#${this.id}`)
  }
  getReduxStore() {
    return cy.window().its('store').invoke('getState')
  }
  connectWallet() {
    this.withinPage()
      .contains('button', this.walletConnectButtonText)
      .should('exist')
      .click()
  }
  requestMetamaskConnect() {
    this.connectWallet()
    cy.get('#connectMetaMask').should('exist').click()
  }

  checkNavigationListEthereum() {
    this.header
      .getNavigationLinks()
      .should('not.be.empty')
      .and(($p) => {
        // should have found 6 elements for Ethereum
        expect($p).to.have.length(6)

        // // use jquery's map to grab all of their classes
        // // jquery's map returns a new jquery object
        const links = $p.map((i, el) => {
          return Cypress.$(el).attr('href')
        })
        // call classes.get() to make this a plain array
        expect(links.get()).to.deep.eq([
          '/bridge',
          '/bridge',
          '/history',
          '/earn',
          '/stake',
          '/DAO',
        ])

        // get labels and verify
        const labels = $p.map((i, el) => {
          return Cypress.$(el).text()
        })

        expect(labels.get()).to.deep.eq([
          '',
          'Bridge',
          'History',
          'Earn',
          'Stake',
          'Dao',
        ])
      })
  }
  checkNetworkSwitcherMainnet() {
    this.header.getNetworkSwitcher().click()

    this.header.getNetworkSwitcher().contains('Ethereum').should('exist')

    this.header
      .getNetworkSwitcher()
      .contains('Binance Smart Chain')
      .should('exist')

    this.header
      .getNetworkSwitcher()
      .contains('Avalanche Mainnet C-Chain')
      .should('exist')

    this.header.getNetworkSwitcher().click()
  }
  checkNetworkSwitcherTestnet() {
    this.header
      .getNetworkSwitcher()
      .click()
      .should('have.text', 'Ethereum (Goerli)')
      .should('have.text', 'BNB Testnet')
      .should('have.text', 'Fuji Testnet')
  }
  checkThemeSwitcher() {
    this.header.getLightThemeSwitcher().should('exist').click()
    this.header.getDarkThemeSwitcher().should('exist').click()
    this.header.getLightThemeSwitcher().should('exist')
  }

  checkSocialMediaLinks() {
    this.footer
      .getSocialMediaLinks()
      .should('not.be.empty')
      .and(($p) => {
        // should have found 4 elements
        expect($p).to.have.length(4)

        // // use jquery's map to grab all of their classes
        // // jquery's map returns a new jquery object
        const links = $p.map((i, el) => {
          return Cypress.$(el).attr('href')
        })
        // call classes.get() to make this a plain array
        expect(links.get()).to.deep.eq([
          'https://docs.boba.network',
          'https://boba.eco/twitter',
          'https://boba.eco/discord',
          'https://boba.eco/telegram',
        ])

        // get labels and verify
        const labels = $p.map((i, el) => {
          return Cypress.$(el).attr('aria-label')
        })

        expect(labels.get()).to.deep.eq([
          'bobaDocs',
          'twitter',
          'discord',
          'telegram',
        ])
      })
  }
  checkFooterLinks() {
    this.footer
      .getFooterLinks()
      .should('not.be.empty')
      .and(($p) => {
        // should have found 4 elements
        expect($p).to.have.length(7)
        // make sure the first contains some text content
        expect($p.first()).to.contain('FAQs')
        // // use jquery's map to grab all of their classes
        // // jquery's map returns a new jquery object
        const links = $p.map((i, el) => {
          return Cypress.$(el).attr('href')
        })
        // call classes.get() to make this a plain array
        expect(links.get()).to.deep.eq([
          'https://docs.boba.network/faq',
          '/devtools',
          '/bobascope',
          'https://etherscan.io/',
          'https://bobascan.com/',
          'https://boba.network',
          'https://boba.network/terms-of-use/',
        ])
        // get labels and verify
        const labels = $p.map((i, el) => {
          return Cypress.$(el).text()
        })
        expect(labels.get()).to.deep.eq([
          'FAQs',
          'Dev Tools',
          'Bobascope',
          'Blockexplorer',
          'Boba Blockexplorer',
          'Boba Network Website',
          'Terms of Use',
        ])
      })
  }

  handleNetworkSwitchModals(networkAbbreviation: string, isTestnet: boolean) {
    cy.get(
      `button[label="Switch to ${networkAbbreviation} ${
        isTestnet ? 'Testnet' : ''
      } network"]`
    )
      .should('exist')
      .click()

    this.verifyReduxStoreSetup('accountEnabled', false)
    this.verifyReduxStoreSetup('baseEnabled', false)

    cy.get(
      `button[label="Connect to the ${networkAbbreviation} ${
        isTestnet ? 'Testnet' : 'Mainnet'
      } network"]`
    )
      .should('exist')
      .click()
  }

  switchThroughMainnetNetworks() {
    // switch to BNB
    this.header.switchNetwork('Binance')
    this.handleNetworkSwitchModals('BNB', false)
    this.allowNetworkSwitch()
    this.checkNetworkSwitchSuccessful('BNB')

    // switch to AVAX
    this.header.switchNetwork('Avalanche Mainnet')
    this.handleNetworkSwitchModals('AVAX', false)
    this.allowNetworkSwitch()
    this.checkNetworkSwitchSuccessful('AVAX')

    // switch to Ethereum
    this.header.switchNetwork('Ethereum')
    this.handleNetworkSwitchModals('ETHEREUM', false)
    this.allowNetworkSwitch()
    this.checkNetworkSwitchSuccessful('ETHEREUM')
  }

  checkNetworkSwitchSuccessful(networkAbbreviation: string) {
    this.verifyReduxStoreNetwork('activeNetwork', networkAbbreviation)

    this.verifyReduxStoreSetup('accountEnabled', true)
    this.verifyReduxStoreSetup('baseEnabled', true)
  }

  verifyReduxStoreSetup(attribute: string, expectedValue: boolean | string) {
    this.getReduxStore()
      .its('setup')
      .its(attribute)
      .should(`equal`, expectedValue)
  }

  verifyReduxStoreNetwork(attribute: string, expectedValue: boolean | string) {
    this.getReduxStore()
      .its('network')
      .its(attribute)
      .should('equal', expectedValue)
  }

  disconnectWallet() {
    this.header.disconnectWallet()
  }
}
