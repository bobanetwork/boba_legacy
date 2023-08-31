import Page from '../pages/base/page'
import { Binance, Avalanche } from '../constants'

const page = new Page()

describe('Page', () => {
  before(() => {
    page.addNetwork(Binance)
    page.addNetwork(Avalanche)
    page.visit()
    page.changeMetamaskNetwork('ethereum')
    page.header.requestMetamaskConnect()
    page.connectMetamask()
  })
  after(() => {
    page.header.disconnectWallet()
  })
  describe.only('Page Header', () => {
    it('Navigation List', () => {
      page.checkNavigationListEthereum()
    })
    it('Network Switcher exist', () => {
      page.checkNetworkSwitcherMainnet()
    })

    it('Network Switcher can switch networks', () => {
      page.switchThroughMainnetNetworks()
    })

    it('theme switcher is functional', () => {
      page.checkThemeSwitcher()
    })
  })
  describe.only('Page Footer', () => {
    it('Social Media Links', () => {
      page.checkSocialMediaLinks()
    })
    it('Footer Links', () => {
      page.checkFooterLinks()
    })
  })
})
