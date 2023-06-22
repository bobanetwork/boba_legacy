import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import { render } from '@testing-library/react'

import CustomThemeProvider from 'themes'
import { PageTitleTypes } from './types'

import { PageTitle } from '.'

const mockStore = configureStore()

const renderTypography = (props: PageTitleTypes) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
      })}
    >
      <BrowserRouter>
        <CustomThemeProvider>
          <PageTitle {...props}>Text goes here</PageTitle>
        </CustomThemeProvider>
      </BrowserRouter>
    </Provider>
  )
}

describe('PageTitle', () => {
  test('should match snapshots head', () => {
    const { asFragment } = renderTypography({
      title: 'Page Title',
      slug: 'This is the current slug',
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
