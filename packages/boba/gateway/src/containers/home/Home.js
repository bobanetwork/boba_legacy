/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { getFS_Saves, getFS_Info } from 'actions/fixedAction'

import {
  fetchBalances,
} from 'actions/networkAction'

import {
  selectAccountEnabled,
  selectActiveNetwork,
} from 'selectors'

/******** COMPONENTS ********/
import { PageTitle } from 'components/layout/PageTitle'

/******** UTILS ********/
import { POLL_INTERVAL } from 'util/constant'
import useInterval from 'hooks/useInterval'
import useGoogleAnalytics from 'hooks/useGoogleAnalytics'
import useNetwork from 'hooks/useNetwork'
import { NETWORK } from 'util/network/network.util'
import NotificationBanner from 'components/notificationBanner'
import { Footer, Header } from 'components/layout'
import ModalContainer from 'containers/modals'
import NotificationAlert from 'components/alert/Alert'

import { HomeContainer, HomeContent } from './styles'
import { useOnboard } from 'hooks/useOnboard'
import { useWalletConnect } from 'hooks/useWalletConnect'

const Home = () => {
  const dispatch = useDispatch()
  const activeNetwork = useSelector(selectActiveNetwork())
  const accountEnabled = useSelector(selectAccountEnabled())
  useInterval(() => {
    if (accountEnabled /*== MetaMask is connected*/) {
      dispatch(fetchBalances()) // account specific
      if (activeNetwork === NETWORK.ETHEREUM) {
        console.log(`calling getFS info - ${accountEnabled}`)
        dispatch(getFS_Info())   // account specific
        dispatch(getFS_Saves()) // account specific
      }
    }
  }, POLL_INTERVAL)

  useGoogleAnalytics(); // Invoking GA analysis page view hooks
  useOnboard()
  useNetwork()
  useWalletConnect()

  return (
    <>
      <ModalContainer />
      <NotificationAlert />
      <NotificationBanner />
      <HomeContainer>
        <Header />
        <HomeContent>
          <PageTitle />
          <Outlet />
        </HomeContent>
        <Footer />
      </HomeContainer>
    </>
  )
}

export default memo(Home);
