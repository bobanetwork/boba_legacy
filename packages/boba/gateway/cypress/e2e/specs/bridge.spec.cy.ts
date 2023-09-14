import Bridge from '../pages/bridge'
import { Layer } from '../../../src/util/constant'
const bridge = new Bridge()

describe('Bridge', () => {
  before(() => {
    bridge.visit()
    bridge.verifyReduxStoreSetup('baseEnabled', true)
    bridge.requestMetamaskConnect()
  })
  after(() => {
    bridge.header.disconnectWallet()
  })

  describe('Bridging', () => {
    before(() => {
      bridge.switchNetworkType('ETHEREUM', true, false)
    })
    after(() => {
      bridge.switchNetworkType('ETHEREUM', false, false)
    })
    it('should bridge ETH and Boba from L1 to L2', () => {
      bridge.bridgeToken('ETH', '0.001', Layer.L2)
    })
    it('should switch bridge direction', () => {
      // switch bridge direction from L2 to L1
      bridge.switchBridgeDirection(Layer.L2, true)
    })
    it('should bridge ETH from L2 to L1', () => {
      bridge.bridgeToken('ETH', '0.001', Layer.L1)
    })
    it('should switch bridge direction', () => {
      // switch bridge direction from L1 to L2
      bridge.switchBridgeDirection(Layer.L1, false)
    })
  })
})
