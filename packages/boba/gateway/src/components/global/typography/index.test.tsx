import { render } from '@testing-library/react'
import { TypographyProps } from './types'
import CustomThemeProvider from 'themes'
import { Typography } from '.'
import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

const mockStore = configureStore()

const renderTypography = (props: TypographyProps) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
      })}
    >
      <CustomThemeProvider>
        <Typography {...props}>Text goes here</Typography>
      </CustomThemeProvider>
    </Provider>
  )
}

describe('Typography', () => {
  test('should match snapshots h1', () => {
    const { asFragment } = renderTypography({
      variant: 'h1',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots head', () => {
    const { asFragment } = renderTypography({
      variant: 'head',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots title', () => {
    const { asFragment } = renderTypography({
      variant: 'title',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots body1', () => {
    const { asFragment } = renderTypography({
      variant: 'body1',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots body2', () => {
    const { asFragment } = renderTypography({
      variant: 'body2',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots body3', () => {
    const { asFragment } = renderTypography({
      variant: 'body3',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('should match snapshots subtitle', () => {
    const { asFragment } = renderTypography({
      variant: 'subtitle',
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
