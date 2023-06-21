import { render } from '@testing-library/react'
import { PageTitleTypes } from './types'
import CustomThemeProvider from 'themes'
import { PageTitle } from '.'
import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

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
      <CustomThemeProvider>
        <PageTitle {...props}>Text goes here</PageTitle>
      </CustomThemeProvider>
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
