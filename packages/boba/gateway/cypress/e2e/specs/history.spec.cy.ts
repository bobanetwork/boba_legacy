import History from '../pages/history'

const history = new History()

describe('History', () => {
  before(() => {
    history.visit()
    history.waitForPageToLoad()
    history.requestMetamaskConnect()
  })
  describe('transactions', () => {
    it('should load', () => {
      history.waitForTransactionsToLoad()
    })
  })
  describe('filters', () => {
    it('search bar', () => {
      history.checkSearchInput()
    })
    it('date pickers', () => {
      history.getFromDatePicker()
      history.getToDatePicker()
      history.checkDatePickers()
    })

    it('network dropdowns', () => {
      history.checkNetworkDropdowns()
      history.getNetworksSwitchIcon()
    })
    it('status filter', () => {
      history.getStatusFilter()
    })
  })
})
