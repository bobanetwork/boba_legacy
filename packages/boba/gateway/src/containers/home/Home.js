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

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { Box, Container, useTheme, useMediaQuery } from '@mui/material'

import networkService from 'services/networkService'

import { setBaseState } from 'actions/setupAction'
import {
  fetchDaoBalance,
  fetchDaoVotes,
  fetchDaoBalanceX,
  fetchDaoVotesX,
  fetchDaoProposals,
  getProposalThreshold
} from 'actions/daoAction'

import { getFS_Saves, getFS_Info } from 'actions/fixedAction'

import {
  fetchBalances,
  addTokenList
} from 'actions/networkAction'
import {
  getMonsterInfo
} from 'actions/nftAction'

import {
  selectBaseEnabled,
  selectAccountEnabled,
  selectActiveNetwork,
  selectActiveNetworkType
} from 'selectors'

/******** COMPONENTS ********/
import { PageTitle } from 'components/layout/PageTitle'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'

/******** UTILS ********/
import { POLL_INTERVAL } from 'util/constant'
import useInterval from 'hooks/useInterval'
import useGoogleAnalytics from 'hooks/useGoogleAnalytics'
import useNetwork from 'hooks/useNetwork'
import { NETWORK } from 'util/network/network.util'
import useWalletSwitch from 'hooks/useWalletSwitch'
import NotificationBanner from 'components/notificationBanner'
import { Footer, Header } from 'components/layout'
import ModalContainer from 'containers/modals'
import NotificationAlert from 'components/alert/Alert'

import { HomeContainer, HomeContent } from './styles'

function Home() {

  const dispatch = useDispatch()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const activeNetwork = useSelector(selectActiveNetwork())
  const activeNetworkType = useSelector(selectActiveNetworkType())
  const baseEnabled = useSelector(selectBaseEnabled())
  const accountEnabled = useSelector(selectAccountEnabled())

  useEffect(() => {
    window.scrollTo(0, 0)

    if (!baseEnabled) initializeBase()

    async function initializeBase() {
      const initialized = await networkService.initializeBase({
        networkGateway: activeNetwork,
        networkType: activeNetworkType
      })

      if (!initialized) {
        dispatch(setBaseState(false))
        return false
      }
      if (initialized === 'enabled') {
        dispatch(setBaseState(true))
        // load DAO to speed up the process
        if (activeNetwork === NETWORK.ETHEREUM) {
          dispatch(fetchDaoProposals())
        }
        return true
      }
    }

  }, [ dispatch, activeNetwork, activeNetworkType, baseEnabled ])

  useInterval(() => {
    if (accountEnabled /*== MetaMask is connected*/) {
      dispatch(fetchBalances()) // account specific

      if (activeNetwork === NETWORK.ETHEREUM) {
        dispatch(fetchDaoBalance())      // account specific
        dispatch(fetchDaoVotes())        // account specific
        dispatch(fetchDaoBalanceX())     // account specific
        dispatch(fetchDaoVotesX())       // account specific
        dispatch(getMonsterInfo()) // account specific
        dispatch(getFS_Info())   // account specific
        dispatch(getFS_Saves()) // account specific
      }
    }
    /*== we only have have Base L1 and L2 providers*/
    if (activeNetwork === NETWORK.ETHEREUM) {
      dispatch(getProposalThreshold())
      dispatch(fetchDaoProposals())
    }
  }, POLL_INTERVAL)

  useEffect(() => {
    if (accountEnabled) {
      dispatch(addTokenList())
    }
  }, [ dispatch, accountEnabled, activeNetwork ])

  // Invoking GA analysis page view hooks
  useGoogleAnalytics();
  useWalletSwitch()
  useNetwork()

  return (
    <>
      <ModalContainer />
      <NotificationAlert />
      <NotificationBanner />

      {isMobile ? <LayerSwitcher visisble={false} /> : null}

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

export default React.memo(Home)
