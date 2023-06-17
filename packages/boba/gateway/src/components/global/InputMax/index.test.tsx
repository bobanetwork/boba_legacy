import React from 'react'
import { render } from '@testing-library/react'
import { MaxInputTypes } from './types'
import CustomThemeProvider from 'themes'
import { MaxInput } from './'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

const mockStore = configureStore()

const renderInputMax = (props: MaxInputTypes) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'light',
        },
      })}
    >
      <CustomThemeProvider>
        <MaxInput {...props}>Test Button</MaxInput>
      </CustomThemeProvider>
    </Provider>
  )
}

describe('MaxInput', () => {
  test('Max Input Component without Initial Value', () => {
    const { asFragment } = renderInputMax({
      max: 10,
      onValueChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('Max Input Component with Initial Value', () => {
    const { asFragment } = renderInputMax({
      max: 10,
      initialValue: 5,
      onValueChange: jest.fn(),
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
