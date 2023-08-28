import Bridge from '../pages/bridge'

const bridge = new Bridge()

describe('Bridge', () => {
  before(() => {
    bridge.clearAllCookies()
    bridge.visit()
    bridge.header.requestMetamaskConnect()
    bridge.connectMetamask()
  })
})
