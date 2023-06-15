import React from 'react'
import { render } from '@testing-library/react'
import Theme from 'themes'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import BridgeAlert from '../BridgeAlert'
import { NETWORK } from 'util/network/network.util'
import * as constants from 'util/constant'

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
        <BridgeAlert />
      </Theme>
    </Provider>
  )
}

describe('BridgeAlert', () => {
  test('should match the snapshot when active network is ethereum', () => {
    Object.defineProperty(constants, 'BOBAOPERA_STATUS', {
      value: 1,
      writable: true,
    })
    const { asFragment } = renderComponent({
      network: {
        activeNetwork: NETWORK.ETHEREUM,
      },
    })
    expect(asFragment()).toMatchSnapshot()
  })

  test('should match the snapshot when active network is opera', () => {
    Object.defineProperty(constants, 'BOBAOPERA_STATUS', {
      value: 1,
      writable: true,
    })
    const { asFragment } = renderComponent({
      network: {
        activeNetwork: NETWORK.FANTOM,
      },
    })
    expect(asFragment()).toMatchSnapshot()
  })

  test('should match the snapshot disabled from env params', () => {
    Object.defineProperty(constants, 'BOBAOPERA_STATUS', {
      value: 0,
      writable: true,
    })
    const { asFragment } = renderComponent({
      network: {
        activeNetwork: NETWORK.FANTOM,
      },
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
