import { render } from '@testing-library/react'
import React from 'react'
import Header from '.'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import createMockStore from 'redux-mock-store'
import { MemoryRouter } from 'react-router-dom'

const mockStore = createMockStore()

const renderHeader = () => {
  return render(
    <MemoryRouter>
      <Provider
        store={mockStore({
          ui: {
            theme: 'dark',
          },
        })}
      >
        <CustomThemeProvider>
          <Header />
        </CustomThemeProvider>
      </Provider>
    </MemoryRouter>
  )
}

describe('Layout => Header', () => {
  test('should match the snapshot', () => {
    const { asFragment } = renderHeader()

    expect(asFragment()).toMatchSnapshot()
  })

  xtest('should button with label connect wallet', () => {})

  xtest('should trigger initConnect on click of connect wallet btn', () => {})
})
