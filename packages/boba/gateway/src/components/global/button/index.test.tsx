import React from 'react'
import { render } from '@testing-library/react'
import { ButtonTypes } from './types'
import CustomThemeProvider from 'themes'
import { Button } from './'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

const mockStore = configureStore()

const renderButton = (props: ButtonTypes) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'light',
        },
      })}
    >
      <CustomThemeProvider>
        <Button {...props}>Test Button</Button>
      </CustomThemeProvider>
    </Provider>
  )
}

describe('Button', () => {
  test('Default Button', () => {
    const { asFragment } = renderButton({
      label: 'Test Button',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('Loading Button', () => {
    const { asFragment } = renderButton({
      loading: true,
      label: 'Test Button',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('Disable Button', () => {
    const { asFragment } = renderButton({
      disable: true,
      label: 'Test Button',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('Small Button', () => {
    const { asFragment } = renderButton({
      small: true,
      label: 'Test Button',
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
