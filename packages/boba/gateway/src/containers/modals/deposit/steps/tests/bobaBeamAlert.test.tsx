import React from 'react'
import { render } from '@testing-library/react'
import Theme from 'themes'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import BobaBeamAlert from '../bobaBeamAlert'
import { NETWORK } from 'util/network/network.util'

const mockStore = configureStore()

const renderComponent = (state: any) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
        ...state,
      })}
    >
      <Theme>
        <BobaBeamAlert />
      </Theme>
    </Provider>
  )
}

describe('BobaBeamAlert', () => {
  test('should match the snapshot when active network is ethereum', () => {
    const { asFragment } = renderComponent({
      network: {
        activeNetwork: NETWORK.ETHEREUM,
      },
    })
    expect(asFragment()).toMatchSnapshot()
  })

  test('should match the snapshot when active network is moonbeam', () => {
    const { asFragment } = renderComponent({
      network: {
        activeNetwork: NETWORK.MOONBEAM,
      },
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
