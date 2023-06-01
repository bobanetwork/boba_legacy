import React from 'react'
import { render } from '@testing-library/react'
import Theme from 'themes'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import BobaBeamAlert from '../bobaBeamAlert'
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
        <BobaBeamAlert />
      </Theme>
    </Provider>
  )
}

describe('BobaBeamAlert', () => {
  test('should match the snapshot when active network is ethereum', () => {
    Object.defineProperty(constants, 'BOBABEAM_STATUS', {
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

  test('should match the snapshot when active network is moonbeam', () => {
    Object.defineProperty(constants, 'BOBABEAM_STATUS', {
      value: 1,
      writable: true,
    })
    const { asFragment } = renderComponent({
      network: {
        activeNetwork: NETWORK.MOONBEAM,
      },
    })
    expect(asFragment()).toMatchSnapshot()
  })

  test('should match the snapshot when active network is moonbeam and status is 0', () => {
    Object.defineProperty(constants, 'BOBABEAM_STATUS', {
      value: 0,
      writable: true,
    })
    const { asFragment } = renderComponent({
      network: {
        activeNetwork: NETWORK.MOONBEAM,
      },
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
