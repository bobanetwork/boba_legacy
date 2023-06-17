import React from 'react'
import { render } from '@testing-library/react'
import { SwitchButtonTypes } from './types'
import CustomThemeProvider from 'themes'
import { SwitchButton } from './'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

const mockStore = configureStore()

const renderButton = (props: SwitchButtonTypes) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'light',
        },
      })}
    >
      <CustomThemeProvider>
        <SwitchButton {...props} />
      </CustomThemeProvider>
    </Provider>
  )
}

describe('SwitchButton', () => {
  test('SwitchButton Default State', () => {
    const { asFragment } = renderButton({
      onStateChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('SwitchButton is Active', () => {
    const { asFragment } = renderButton({
      isActive: true,
      onStateChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('SwitchButton is Disable', () => {
    const { asFragment } = renderButton({
      isDisable: true,
      onStateChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('SwitchButton is Disable & Active', () => {
    const { asFragment } = renderButton({
      isActive: true,
      isDisable: true,
      onStateChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
