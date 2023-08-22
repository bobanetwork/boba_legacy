describe('template spec', () => {
  it('passes', () => {
    cy.visit('/')
  })

  it('should connect wallet with success', () => {
    cy.get('button[label|="Connect Wallet"]').click()
    cy.get('#connectMetaMask').click()
    cy.acceptMetamaskAccess()
  })
})
