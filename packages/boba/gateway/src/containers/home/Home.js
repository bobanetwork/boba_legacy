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

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { Box, Container, Grid, Link, Typography, useTheme, useMediaQuery } from '@mui/material'

/**** styles *****/
import * as S from './Home.styles'
import turing from '../../images/boba2/turing.png'

/**** serice *****/
import networkService from 'services/networkService'

/**** ACTIONS and SELECTORS *****/
import { setBaseState } from 'actions/setupAction'
import {
  fetchDaoBalance,
  fetchDaoVotes,
  fetchDaoBalanceX,
  fetchDaoVotesX,
  fetchDaoProposals,
  getProposalThreshold
} from 'actions/daoAction'

import {
  fetchAirdropStatusL1,
  fetchAirdropStatusL2
} from 'actions/airdropAction'
import { checkVersion } from 'actions/serviceAction'
import { closeAlert, closeError } from 'actions/uiAction'
import { getFS_Saves, getFS_Info } from 'actions/fixedAction'
import { fetchVerifierStatus } from 'actions/verifierAction'
import { fetchLockRecords } from 'actions/veBobaAction'
import {
  fetchBalances,
  fetchGas,
  addTokenList,
  fetchExits
} from 'actions/networkAction'

/********   SELECTORS ********/
import {
  selectBaseEnabled,
  selectAccountEnabled,
  selectNetwork,
} from 'selectors/setupSelector'
import { selectAlert, selectError } from 'selectors/uiSelector'
import { selectModalState } from 'selectors/uiSelector'

/******** MODALs ********/
import DepositModal from 'containers/modals/deposit/DepositModal'
import TransferModal from 'containers/modals/transfer/TransferModal'
import ExitModal from 'containers/modals/exit/ExitModal'

import FarmWrapper from 'containers/farm/FarmWrapper'
import FarmDepositModal from 'containers/modals/farm/FarmDepositModal'
import FarmWithdrawModal from 'containers/modals/farm/FarmWithdrawModal'

import TokenPickerModal from 'containers/modals/tokenPicker/TokenPickerModal'
import TransferPendingModal from 'containers/modals/transferPending/TransferPending'
import WrongNetworkModal from 'containers/modals/wrongNetwork/WrongNetworkModal';
import ManageLockModal from 'containers/modals/veBoba/ManageLockModal';

import Transactions from 'containers/history/History'
import BobaScope from 'containers/bobaScope/BobaScope'
import Wallet from 'containers/wallet/Wallet'

/******** COMPONENTS ********/
import PageTitle from 'components/pageTitle/PageTitle'
import PageHeader from 'components/pageHeader/PageHeader'
import PageFooter from 'components/pageFooter/PageFooter'
import Alert from 'components/alert/Alert'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import Zendesk from 'components/zendesk/Zendesk'

/******** UTILS ********/
import { POLL_INTERVAL } from 'util/constant'
import useInterval from 'hooks/useInterval'
import useGoogleAnalytics from 'hooks/useGoogleAnalytics'

require('dotenv').config()

function Home() {

  const dispatch = useDispatch()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const errorMessage = useSelector(selectError)
  const alertMessage = useSelector(selectAlert)

  const [ mobileMenuOpen ] = useState(false)

  const depositModalState = useSelector(selectModalState('depositModal'))

  const transferModalState = useSelector(selectModalState('transferModal'))

  const exitModalState = useSelector(selectModalState('exitModal'))
  const tokenPickerModalState = useSelector(selectModalState('tokenPicker'));
  const transferPendingModalState = useSelector(selectModalState('transferPending'));
  const wrongNetworkModalState = useSelector(selectModalState('wrongNetworkModal'));
  const manageLockModalState = useSelector(selectModalState('manageLock'));

  const fast = useSelector(selectModalState('fast'))
  const token = useSelector(selectModalState('token'))
  const tokenIndex = useSelector(selectModalState('tokenIndex'))
  const lock = useSelector(selectModalState('lock'))

  const farmDepositModalState = useSelector(selectModalState('farmDepositModal'))
  const farmWithdrawModalState = useSelector(selectModalState('farmWithdrawModal'))

  const network = useSelector(selectNetwork())
  const baseEnabled = useSelector(selectBaseEnabled())
  const accountEnabled = useSelector(selectAccountEnabled())

  const handleErrorClose = () => dispatch(closeError())
  const handleAlertClose = () => dispatch(closeAlert())

  const maintenance = process.env.REACT_APP_STATUS === 'maintenance' ? true : false

  useEffect(() => {
    const body = document.getElementsByTagName('body')[ 0 ]
    mobileMenuOpen
      ? body.style.overflow = 'hidden'
      : body.style.overflow = 'auto'
  }, [ mobileMenuOpen ])

  // calls only on boot
  useEffect(() => {
    window.scrollTo(0, 0)

    if (maintenance) return

    if (!baseEnabled) initializeBase()

    async function initializeBase() {
      console.log("Calling initializeBase for", network)
      const initialized = await networkService.initializeBase( network )
      if (!initialized) {
        console.log("Failed to boot L1 and L2 base providers for", network)
        dispatch(setBaseState(false))
        return false
      }
      if (initialized === 'enabled') {
        console.log("Network Base Providers are up")
        dispatch(setBaseState(true))
        return true
      }
    }

  }, [ dispatch, network, baseEnabled, maintenance ])

  useInterval(() => {
    if(accountEnabled /*== MetaMask is connected*/) {
      dispatch(fetchBalances()) // account specific
      dispatch(fetchExits())           // account specific
    }
    if(baseEnabled /*== we only have have Base L1 and L2 providers*/) {
      dispatch(fetchGas())
    }
  }, POLL_INTERVAL)

  useEffect(() => {
    if (maintenance) return
    // load the following functions when the home page is open
    checkVersion()
    dispatch(fetchGas())
  }, [ dispatch, maintenance ])

  useEffect(() => {
    if (maintenance) return
    if (accountEnabled) {
      dispatch(addTokenList())
    }
  }, [ dispatch, accountEnabled, maintenance ])

  // Invoking GA analysis page view hooks
  useGoogleAnalytics();

  return (
    <>
      {!!depositModalState && <DepositModal  open={depositModalState}  token={token} fast={fast} />}

      {!!transferModalState && <TransferModal open={transferModalState} token={token} />}

      {!!exitModalState && <ExitModal open={exitModalState} token={token} fast={fast} />}

      {!!farmDepositModalState && <FarmDepositModal open={farmDepositModalState} />}
      {!!farmWithdrawModalState && <FarmWithdrawModal open={farmWithdrawModalState} />}

      {!!tokenPickerModalState && <TokenPickerModal tokenIndex={tokenIndex} open={tokenPickerModalState} />}
      {!!transferPendingModalState && <TransferPendingModal open={transferPendingModalState} />}
      {!!wrongNetworkModalState && <WrongNetworkModal open={wrongNetworkModalState} />}
      {!!manageLockModalState && <ManageLockModal open={manageLockModalState} lock={lock} />}

      <Alert
        type='error'
        duration={0}
        open={!!errorMessage}
        onClose={handleErrorClose}
        position={50}
      >
        {errorMessage}
      </Alert>

      <Alert
        type='success'
        duration={0}
        open={!!alertMessage}
        onClose={handleAlertClose}
        position={0}
      >
        {alertMessage}
      </Alert>
      <Zendesk />
      { isMobile ? <LayerSwitcher visisble={false} /> : null }

      {!!maintenance &&
        <Box sx={{
          display: 'flex',
          height: '100%',
          flexDirection: 'column',
          width: '100%'
        }}>
          <PageHeader maintenance={maintenance}/>
          <Container maxWidth={false} sx={{
            height: 'calc(100% - 150px)',
            minHeight: '500px',
            marginLeft: 'unset',
            width: '100vw',
            marginRight: 'unset',
            paddingTop: '50px'
          }}>
            <S.HomePageContainer>
              <PageTitle title="Boba March 4 Maintenance Mode"/>
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  component="p" sx={{mt: 2, mb: 0, fontWeight: '700', paddingBottom: '20px'}}
                >
                  We are upgrading our Sequencer to support Turing Hybrid Compute
                </Typography>
                <Typography variant="body2" component="p" sx={{mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7'}}>
                  As announced on Twitter and Telegram, Boba network is currently being upgraded to support Turing.
                </Typography>
                <Typography variant="body2" component="p" sx={{
                  mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7',
                  paddingTop: '20px', paddingBottom: '20px'}}
                >
                  You can{' '}
                  <Link variant="body2"
                    style={{lineHeight: '1.0em', fontWeight: '700'}}
                    href='https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/README.md'
                  >learn more about Turing here
                  </Link>.
                </Typography>
                <img
                  src={turing}
                  alt="NFT URI"
                  width={'80%'}
                />
              </Grid>
            </S.HomePageContainer>
          </Container>
          <PageFooter maintenance={maintenance}/>
        </Box>
      }

      {! maintenance &&
        <Box sx={{ display: 'flex',height: '100%', flexDirection: 'column', width: '100%' }}>
          <PageHeader />
          <Container maxWidth={false} sx={{
            height: 'calc(100% - 150px)',
            minHeight: '500px',
            marginLeft: 'unset',
            width: '100vw',
            marginRight: 'unset'
          }}>
            <Outlet />
          </Container>
          <PageFooter/>
        </Box>
      }
    </>
  )
}

export default React.memo(Home)
