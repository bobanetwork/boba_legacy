export default class Base {
  connectMetamask() {
    cy.acceptMetamaskAccess()
  }
  changeMetamaskNetwork(networkName: string) {
    cy.changeMetamaskNetwork(networkName)
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
