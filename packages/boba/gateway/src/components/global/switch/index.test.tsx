import React from 'react'
import { render } from '@testing-library/react'
import { SwitchButtonTypes } from './types'
import CustomThemeProvider from 'themes'
import { SwitchButton } from './'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

const mockStore = configureStore()

const renderSwitch = (props: SwitchButtonTypes) => {
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
    const { asFragment } = renderSwitch({
      onStateChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('SwitchButton is Active', () => {
    const { asFragment } = renderSwitch({
      isActive: true,
      onStateChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('SwitchButton is Disable', () => {
    const { asFragment } = renderSwitch({
      isDisable: true,
      onStateChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('SwitchButton is Disable & Active', () => {
    const { asFragment } = renderSwitch({
      isActive: true,
      isDisable: true,
      onStateChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
