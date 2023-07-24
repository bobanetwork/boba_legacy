import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CustomThemeProvider from 'themes'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import { PlaceholderConnect } from './'
import { PlaceholderConnectInterface } from './types'

const mockStore = configureStore()
const renderPlaceholderConnect = (props: PlaceholderConnectInterface) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'light',
        },
        setup: {
          netLayer: 'L2',
        },
      })}
    >
      <BrowserRouter>
        <CustomThemeProvider>
          <PlaceholderConnect {...props} />
        </CustomThemeProvider>
      </BrowserRouter>
    </Provider>
  )
}

describe('PlaceholderConnect', () => {
  test('PlaceholderConnect is not loading', () => {
    const { asFragment } = renderPlaceholderConnect({
      isLoading: false,
    })
    expect(asFragment()).toMatchSnapshot()
  })
  test('PlaceholderConnect is loading', () => {
    const { asFragment } = renderPlaceholderConnect({
      isLoading: true,
      preloader: <>{'loading'}</>,
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
