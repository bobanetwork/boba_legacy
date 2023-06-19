import React from 'react'
import { render } from '@testing-library/react'
import { SvgTypes } from './types'
import CustomThemeProvider from 'themes'
import { Svg } from './'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

const mockStore = configureStore()

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

describe('Svg', () => {
  test('Render Svg File', () => {
    const { asFragment } = renderSvg({
      fill: '#ccc',
      src: 'static/media/src/images/icons/arrowdown.svg',
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
