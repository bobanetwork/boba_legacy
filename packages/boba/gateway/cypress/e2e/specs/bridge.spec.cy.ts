import Bridge from '../pages/bridge'
import { Layer } from '../../../src/util/constant'

const bridge = new Bridge()

describe('Bridge', () => {
  before(() => {
    bridge.visit()
    // waiting for baseEnabled to be set
    bridge.waitForPageToLoad()
    bridge.requestMetamaskConnect()
  })
  after(() => {
    bridge.header.disconnectWallet()
    bridge.changeMetamaskNetwork('ethereum')
  })

  describe('Bridging', () => {
    before(() => {
      bridge.switchToTestnet()
    })
    it('should bridge ETH from L1 to L2', () => {
      bridge.bridgeToken('ETH', '0.001', Layer.L2)
    })
    it('should switch bridge direction', () => {
      // switch bridge direction from L2 to L1
      bridge.switchBridgeDirection(Layer.L2)
    })
    it('should bridge ETH from L2 to L1', () => {
      bridge.bridgeToken('ETH', '0.001', Layer.L1)
    })
  })
})
