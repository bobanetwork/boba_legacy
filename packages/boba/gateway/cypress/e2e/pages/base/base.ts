import { MetamaskNetwork } from '../../types'

export default class Base {
  connectMetamask() {
    cy.acceptMetamaskAccess()
  }
  changeMetamaskNetwork(networkName: string) {
    cy.changeMetamaskNetwork(networkName)
  }

  allowNetworkSwitch() {
    cy.allowMetamaskToSwitchNetwork()
  }
  confirmTransactionOnMetamask() {
    cy.confirmMetamaskTransaction()
  }

  addNetwork(network: MetamaskNetwork) {
    cy.addMetamaskNetwork(network)
  }
  allowNetworkToBeAdded() {
    cy.allowMetamaskToAddNetwork()
  }
  allowNetworkToBeAddedAndSwitchedTo() {
    cy.allowMetamaskToAddAndSwitchNetwork()
  }
  allowMetamaskToSpendToken(amount?: string) {
    cy.confirmMetamaskPermissionToSpend(amount)
  }

  readLocalStorage() {
    return cy.getAllLocalStorage()
  }

  getBody() {
    return cy.get('body')
  }
  getModal() {
    return cy.get('div[aria-labelledby="transition-modal-title"]')
  }
  clearAllCookies() {
    cy.clearAllCookies()
  }
}
