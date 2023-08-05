import React from 'react'
import { render } from '@testing-library/react'
import { SvgTypes } from './types'
import CustomThemeProvider from 'themes'
import { Svg } from './'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import styled from 'styled-components'
const mockStore = configureStore()
const ArrowOnHover = styled.div`
  svg {
    &:hover {
      fill: red;
    }
  }
`

const renderSvg = (props: SvgTypes) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'light',
        },
      })}
    >
      <CustomThemeProvider>
        <Svg {...props} />
      </CustomThemeProvider>
    </Provider>
  )
}

const renderWrappedSvg = (props: SvgTypes) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'light',
        },
      })}
    >
      <CustomThemeProvider>
        <ArrowOnHover>
          <Svg {...props} />
        </ArrowOnHover>
      </CustomThemeProvider>
    </Provider>
  )
}

describe('Svg', () => {
  test('Render Svg File', () => {
    const { asFragment } = renderSvg({
      fill: '#ccc',
      src: 'static/media/src/images/icons/arrowdown.svg',
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('Render Wrapped Svg file', () => {
    const { asFragment } = renderWrappedSvg({
      fill: 'yellow',
      src: 'static/media/src/images/icons/arrowdown.svg',
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
