import History from '../pages/history'

const history = new History()

describe('History', () => {
  before(() => {
    history.visit()
    cy.wait(1000)
    history.requestMetamaskConnect()
  })
  describe('Filters', () => {
    it('should have a hash search field', () => {
      history.getSearchInput()
    })
    it('should have two date pickers', () => {
      history.getFromDatePicker()
      history.getToDatePicker()
    })
  })
})
