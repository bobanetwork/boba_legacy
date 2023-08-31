import Bridge from '../pages/bridge'

const bridge = new Bridge()

describe('Bridge', () => {
  before(() => {
    bridge.visit()
    // waiting for baseEnabled to be set
    cy.wait(1000)
    bridge.requestMetamaskConnect()
  })
  after(() => {
    bridge.header.disconnectWallet()
    bridge.changeMetamaskNetwork('ethereum')
  })

  describe.only('Bridging', () => {
    before(() => {
      bridge.switchToTestnet()
    })
    it('Should bridge ETH', () => {
      bridge.bridgeToken('ETH', '0.001')
    })
  })
})
