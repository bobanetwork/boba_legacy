import React from 'react'
import { render } from '@testing-library/react'
import { HeadingProps } from './types'
import CustomThemeProvider from 'themes'
import { Heading } from './'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

const mockStore = configureStore()

const renderHeading = (props: HeadingProps) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
      })}
    >
      <CustomThemeProvider>
        <Heading {...props}>Test Heading</Heading>
      </CustomThemeProvider>
    </Provider>
  )
}

describe('Heading', () => {
  test('should match snapshots h1', () => {
    const { asFragment } = renderHeading({
      variant: 'h1',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots h2', () => {
    const { asFragment } = renderHeading({
      variant: 'h2',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots h3', () => {
    const { asFragment } = renderHeading({
      variant: 'h3',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots h4', () => {
    const { asFragment } = renderHeading({
      variant: 'h4',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots h5', () => {
    const { asFragment } = renderHeading({
      variant: 'h5',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots h6', () => {
    const { asFragment } = renderHeading({
      variant: 'h6',
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
