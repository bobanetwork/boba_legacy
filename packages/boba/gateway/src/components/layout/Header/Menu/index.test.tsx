import { render } from '@testing-library/react'
import React from 'react'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import createMockStore from 'redux-mock-store'
import { MemoryRouter } from 'react-router-dom'
import Menu from '.'

const mockStore = createMockStore()

const renderHeaderMenu = () => {
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
          <Menu />
        </CustomThemeProvider>
      </Provider>
    </MemoryRouter>
  )
}

describe('Layout => Header => Menu', () => {
  test('should match the snapshot', () => {
    const { asFragment } = renderHeaderMenu()

    expect(asFragment()).toMatchSnapshot()
  })

  xtest('should change the location on clicking menu', () => {})

  xtest('should change the menu item color base on the theme', () => {})

  xtest('should change menu item color on hover', () => {})

  xtest('should highlight the menu link for current page', () => {})

  xtest('should menu length as 6 with expected url & labels', () => {})
})
