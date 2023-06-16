import { render, screen } from '@testing-library/react'
import React from 'react'
import Header from '.'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import store from 'store'

const renderHeader = () => {
  return render(
    <MemoryRouter>
      <Provider store={store}>
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

  test('should have button with label connect wallet', () => {
    renderHeader()
    expect(screen.getByText('Connect Wallet')).toBeVisible()
  })
})
