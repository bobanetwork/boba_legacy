import { render } from '@testing-library/react'
import React from 'react'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import createMockStore from 'redux-mock-store'
import { MemoryRouter } from 'react-router-dom'
import ThemeSwitcher from '.'

const mockStore = createMockStore()

const renderThemeSwitcher = () => {
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
          <ThemeSwitcher />
        </CustomThemeProvider>
      </Provider>
    </MemoryRouter>
  )
}

describe('Layout => Header => ThemeSwitcher', () => {
  test('should match the snapshot', () => {
    const { asFragment } = renderThemeSwitcher()

    expect(asFragment()).toMatchSnapshot()
  })
})
