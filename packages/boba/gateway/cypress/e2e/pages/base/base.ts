import { MetamaskNetwork } from '../../types'

export default class Base {
  id: string
  constructor() {
    this.id = ''
  }
  connectMetamask() {
    cy.acceptMetamaskAccess()
  }
  changeMetamaskNetwork(networkName: string) {
    cy.changeMetamaskNetwork(networkName)
  }

  allowNetworkSwitch() {
    cy.allowMetamaskToSwitchNetwork()
  }
  confirmTransaction() {
    cy.confirmMetamaskTransaction()
  }

  addNetwork(network: MetamaskNetwork) {
    cy.addMetamaskNetwork(network)
  }

  readLocalStorage() {
    return cy.getAllLocalStorage()
  }

  getBody() {
    return cy.get('body')
  }
  clearAllCookies() {
    cy.clearAllCookies()
  }
}
