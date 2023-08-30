import Bridge from '../pages/bridge'

const bridge = new Bridge()

describe('Bridge', () => {
  before(() => {
    bridge.visit()
    // waiting for baseEnabled to be set
    cy.wait(1000)
    bridge.header.requestMetamaskConnect()
  })

  describe.only('Bridging', () => {
    before(() => {
      bridge.switchToTestnet()
    })
    it('Should bridge ETH', () => {
      bridge.bridgeToken('ETH', '0.001')
    })
    it('Should have the correct state', () => {
      cy.window()
        .its('store')
        .invoke('getState')
        .then((store) => cy.log(store))
    })
  })
})
