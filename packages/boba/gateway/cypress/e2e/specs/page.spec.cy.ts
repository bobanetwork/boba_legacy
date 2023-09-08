import Page from '../pages/base/page'
import { Binance, Avalanche } from '../constants'

const page = new Page()

describe('Page', () => {
  before(() => {
    page.addNetwork(Binance)
    page.addNetwork(Avalanche)
    page.visit()
    page.verifyReduxStoreSetup('baseEnabled', true)
    page.changeMetamaskNetwork('ethereum')
    page.requestMetamaskConnect()
    page.connectMetamask()
  })
  after(() => {
    page.disconnectWallet()
  })
  describe('Page Header', () => {
    it('Navigation List', () => {
      page.checkNavigationListEthereum()
    })
    it('Network Switcher can switch networks', () => {
      page.switchThroughMainnetNetworks()
    })

    it('theme switcher is functional', () => {
      page.checkThemeSwitcher()
    })
  })
  describe('Page Footer', () => {
    it('Social Media Links', () => {
      page.checkSocialMediaLinks()
    })
    it('Footer Links', () => {
      page.checkFooterLinks()
    })
  })
})
