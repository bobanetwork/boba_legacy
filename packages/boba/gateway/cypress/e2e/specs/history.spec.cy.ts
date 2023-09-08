import History from '../pages/history'

const history = new History()

describe('History', () => {
  before(() => {
    history.visit()
    history.verifyReduxStoreSetup('baseEnabled', true)
    history.requestMetamaskConnect()
    history.waitForTransactionsToLoad()
  })
  describe('filters', () => {
    it('search bar', () => {
      history.checkSearchInput()
    })
    it('date pickers', () => {
      history.checkDatePickers()
    })

    it('network dropdowns', () => {
      history.checkNetworkDropdowns()
      history.getNetworksSwitchIcon()
    })
    it('status filter', () => {
      history.checkStatusFilter()
    })
    it('conjunction of filters', () => {
      history.checkConjunctionOfFilters()
    })
  })
})
