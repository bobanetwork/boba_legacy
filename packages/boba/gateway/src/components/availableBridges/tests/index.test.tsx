import { render, screen } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import CustomThemeProvider from 'themes'
import { AvailableBridges } from '..'
import { NETWORK, NETWORK_TYPE } from 'util/network/network.util'

const mockStore = configureStore()

const renderAvailableBridges = ({
  token,
  walletAddress,
  options = null,
}: any) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
        network: {
          activeNetwork: NETWORK.ETHEREUM,
          activeNetworkType: NETWORK_TYPE.MAINNET,
        },
        ...options,
      })}
    >
      <CustomThemeProvider>
        <AvailableBridges {...{ token, walletAddress }} />
      </CustomThemeProvider>
    </Provider>
  )
}

describe('Available Bridges', () => {
  let token = {
    symbol: 'ETH',
  }
  const walletAddress = 'random-code'

  describe('should match snapshot', () => {
    test('token value is null', () => {
      const { asFragment } = renderAvailableBridges({
        token: null,
        walletAddress,
      })
      expect(asFragment()).toMatchSnapshot()
    })
    test('network type is TESTNET', () => {
      const { asFragment } = renderAvailableBridges({
        token: null,
        walletAddress,
        options: {
          store: {
            network: {
              activeNetwork: NETWORK.ETHEREUM,
              activeNetworkType: NETWORK_TYPE.TESTNET,
            },
          },
        },
      })
      expect(asFragment()).toMatchSnapshot()
    })
    test('selected network is not ETHEREUM', () => {
      const { asFragment } = renderAvailableBridges({
        token: null,
        walletAddress,
        options: {
          store: {
            network: {
              activeNetwork: NETWORK.BNB,
              activeNetworkType: NETWORK_TYPE.TESTNET,
            },
          },
        },
      })
      expect(asFragment()).toMatchSnapshot()
    })

    test('connected on mainnet', () => {
      const { asFragment } = renderAvailableBridges({
        token,
        walletAddress,
      })
      expect(asFragment()).toMatchSnapshot()
    })
  })

  test('should see banxa for ETH token on mainnet', () => {
    renderAvailableBridges({
      token,
      walletAddress,
    })
    expect(screen.getByTestId('banxa')).toBeInTheDocument()
  })
  test('should see banxa for BOBA token on mainnet', () => {
    token = {
      symbol: 'BOBA',
    }
    renderAvailableBridges({
      token,
      walletAddress,
    })
    expect(screen.getByTestId('banxa')).toBeInTheDocument()
  })

  test('should not see banxa for other token on mainnet', () => {
    token = {
      symbol: 'USDC',
    }
    renderAvailableBridges({
      token,
      walletAddress,
    })
    expect(screen.queryByTestId('banxa')).not.toBeInTheDocument()
  })

  describe('Bridges should render correct for token', () => {
    test('should 2 bridge for ETH ', () => {
      renderAvailableBridges({
        token,
        walletAddress,
      })
      expect(screen.queryAllByTestId('bridge').length).toBe(2)
    })
    test('should 2 bridge for BOBA ', () => {
      renderAvailableBridges({
        token: { symbol: 'BOBA' },
        walletAddress,
      })
      expect(screen.queryAllByTestId('bridge').length).toBe(2)
    })
    test('should 2 bridge for USDC ', () => {
      renderAvailableBridges({
        token: { symbol: 'USDC' },
        walletAddress,
      })
      expect(screen.queryAllByTestId('bridge').length).toBe(2)
    })
  })
})
