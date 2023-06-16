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
})
