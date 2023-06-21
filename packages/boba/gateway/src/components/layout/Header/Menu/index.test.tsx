import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import Menu from '.'
import store from 'store'
import { MENU_LIST } from './constant'

const renderHeaderMenu = () => {
  return render(
    <MemoryRouter>
      <Provider store={store}>
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

  test('should have menu length of 6 with expected labels & paths', () => {
    renderHeaderMenu()
    const links = screen.getAllByRole('link')
    expect(links.length).toBe(5)
    links.forEach((link, index) => {
      expect(link).toHaveTextContent(MENU_LIST[index].label)
      expect(link).toHaveAttribute('href', MENU_LIST[index].path)
    })
  })

  test('should change the location on clicking menu', () => {
    renderHeaderMenu()
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      fireEvent.click(link)
      expect(link).toHaveClass('active')
    })
  })
})
