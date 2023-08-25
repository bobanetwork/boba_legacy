import Page from '../pages/base/page'

const page = new Page()

describe('Page', () => {
  before(() => {
    page.visit()
    page.changeMetamaskNetwork('ethereum')
    page.header.requestMetamaskConnect()
    page.connectMetamask()
  })
  describe.only('Page Header', () => {
    beforeEach(() => {
      page.visit()
      page.header.requestMetamaskConnect()
    })
    it('Navigation List', () => {
      page.checkNavigationListEthereum()
    })
    it('Network Switcher exist', () => {
      page.checkNetworkSwitcherMainnet()
    })

    it('theme switcher is functional', () => {
      page.checkThemeSwitcher()
    })
  })
  describe.only('Page Footer', () => {
    beforeEach(() => {
      page.visit()
      page.header.requestMetamaskConnect()
    })
    it('Social Media Links', () => {
      page.checkSocialMediaLinks()
    })
    it('Footer Links', () => {
      page.checkFooterLinks()
    })
  })
})
