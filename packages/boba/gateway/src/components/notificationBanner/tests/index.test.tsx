import React from 'react'
import NotificationBanner from 'components/notificationBanner'
import { render, screen, fireEvent } from '@testing-library/react'
import Theme from 'themes'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import { NETWORK, NETWORK_TYPE } from 'util/network/network.util'
import { BannerConfig } from '../bannerConfig'

jest.mock('../bannerConfig', () => ({
  BannerConfig: {
    FANTOM: {
      message: `BobaOpera is being wound down & will no longer be available, starting June 25th`,
      content: `BobaOpera is being wound down & will no longer be available starting June 25th. For users of BobaOpera or BobaOpera applications you will need to transfer all your funds to Fantom mainnet before June 15th or risk permanently losing access to any assets on BobaOpera.`,
    },
  },
}))

const data = BannerConfig[NETWORK.FANTOM] || {}

const mockStore = configureStore()

const renderBanner = (props: any) => {
  return render(
    <Provider
      store={mockStore({
        ui: {
          theme: 'dark',
        },
        network: {
          activeNetwork: NETWORK.FANTOM,
          activeNetworkType: NETWORK_TYPE.MAINNET,
        },
      })}
    >
      <Theme>
        <NotificationBanner {...props} />
      </Theme>
    </Provider>
  )
}

describe('NotificationBanner ', () => {
  test('should match snapshot without message', () => {
    const { asFragment } = renderBanner({})
    expect(asFragment()).toMatchSnapshot()
  })

  test('should match snapshot and check show banner when open set to true', () => {
    const { asFragment, container } = renderBanner({
      message: data.message,
      open: true,
    })
    expect(asFragment()).toMatchSnapshot()
    expect(container.firstChild).toHaveStyle(`max-height: 60px`)
  })

  test('should show read more btn when the content present update view on click', () => {
    renderBanner({
      message: data.message,
      content: data.content,
      open: true,
    })
    const moreBtn = screen.getByRole('readMore')

    expect(moreBtn).toBeInTheDocument()
    expect(screen.getByText(data.message)).toBeInTheDocument()
    expect(moreBtn).toHaveTextContent(/read more/i)
    expect(moreBtn).not.toHaveTextContent(/read less/i)

    fireEvent.click(moreBtn)
    expect(moreBtn).not.toHaveTextContent(/read more/i)
    expect(screen.getByText(data.content)).toBeInTheDocument()
    expect(moreBtn).toHaveTextContent(/read less/i)
  })
})
