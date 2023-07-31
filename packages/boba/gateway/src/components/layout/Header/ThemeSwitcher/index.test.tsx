import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import ThemeSwitcher from '.'
import store from 'store'

const renderThemeSwitcher = () => {
  return render(
    <MemoryRouter>
      <Provider store={store}>
        <CustomThemeProvider>
          <ThemeSwitcher />
        </CustomThemeProvider>
      </Provider>
    </MemoryRouter>
  )
}

describe('Layout => Header => ThemeSwitcher', () => {
  beforeEach(() => {
    jest.spyOn(Storage.prototype, 'setItem')
    Storage.prototype.setItem = jest.fn()
  })

  test('should match the snapshot', () => {
    const { asFragment } = renderThemeSwitcher()
    expect(asFragment()).toMatchSnapshot()
  })

  test('should switch themes & show icons correctly when clicked on button', () => {
    renderThemeSwitcher()

    expect(screen.queryByTitle('dark-icon')).toBeNull()
    expect(screen.getByTitle('light-icon')).toBeVisible()

    fireEvent.click(screen.getByTitle('light-icon'))
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light')

    expect(screen.getByTitle('dark-icon')).toBeVisible()
    expect(screen.queryByTitle('light-icon')).toBeNull()
  })
})
