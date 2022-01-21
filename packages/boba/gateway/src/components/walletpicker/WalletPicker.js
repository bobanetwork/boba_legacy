/*
Copyright 2021 OMG/BOBA

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { useCallback, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import WrongNetworkModal from 'containers/modals/wrongnetwork/WrongNetworkModal'
import networkService from 'services/networkService'

import { selectModalState } from 'selectors/uiSelector'

import {
  selectWalletMethod,
  selectNetwork,
} from 'selectors/setupSelector'

import { openModal } from 'actions/uiAction'
import { setWalletMethod, setAccountState } from 'actions/setupAction'
import { getAllNetworks } from 'util/masterConfig'

import { isChangingChain } from 'util/changeChain'
import * as S from "./WalletPicker.styles"
import { ReactComponent as Fox } from './../../images/icons/fox-icon.svg'
import { Box, Container, Grid, useMediaQuery } from '@material-ui/core'
import Typography from '@material-ui/core/Typography'
import { styled } from '@material-ui/core/styles'
import { useTheme } from '@emotion/react'
import { enableBrowserWallet } from 'actions/networkAction'

import Button from 'components/button/Button'

require('dotenv').config()

const Root = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(0.2),
  paddingBottom: theme.spacing(0.2),
}))

function WalletPicker({ onEnable, enabled, isButton }) {

  const dispatch = useDispatch()

  const [ walletEnabled, setWalletEnabled ] = useState(false)
  const [ accountEnabled, setAccountEnabled ] = useState(false)
  const [ wrongNetwork, setWrongNetwork ] = useState(false)

  const walletMethod = useSelector(selectWalletMethod())
  const masterConfig = useSelector(selectNetwork())

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const wrongNetworkModalState = useSelector(selectModalState('wrongNetworkModal'))

  let maintenance = false

  if (process.env.REACT_APP_STATUS === 'maintenance') {
    maintenance = true
  }

  const dispatchSetWalletMethod = useCallback((methodName) => {
    console.log("dispatchSetWalletMethod:", methodName)
    dispatch(setWalletMethod(methodName))
  }, [ dispatch ])

  useEffect(() => {

    if (walletMethod === 'browser') {
      setupBrowserWallet()
    }

    async function setupBrowserWallet() {
      console.log("setupBrowserWallet for:", masterConfig)
      const selectedNetwork = masterConfig
      const walletEnabled = await dispatch(enableBrowserWallet(selectedNetwork))
      return walletEnabled
        ? setWalletEnabled(true)
        : dispatchSetWalletMethod(null);
    }

  }, [ dispatchSetWalletMethod, walletMethod, masterConfig, dispatch ])

  useEffect(() => {

    if (walletEnabled) {
      initializeAccount()
    }

    async function initializeAccount() {

      console.log("Calling initializeAccount for:", masterConfig)

      const initialized = await networkService.initializeAccounts(masterConfig)

      if (!initialized) {
        console.log("Error !initialized for:", masterConfig, accountEnabled)
        return setAccountEnabled(false)
      }

      if (initialized === 'wrongnetwork') {
        setAccountEnabled(false)
        return setWrongNetwork(true)
      }

      if (initialized === 'enabled') {
        console.log("NS: ACCOUNT IS ENABLED")
        return setAccountEnabled(true)
      }

    }

  }, [ walletEnabled, masterConfig, accountEnabled ])

  useEffect(() => {
    console.log("NS: accountEnabled?", accountEnabled)
    if (accountEnabled) {
        onEnable(true)
        console.log("NS: SETTING ACCOUNT TO ENABLED")
        dispatch(setAccountState(true))
    }
  }, [ onEnable, accountEnabled, dispatch ])

  useEffect(() => {
    if (walletEnabled && wrongNetwork) {
      dispatch(openModal('wrongNetworkModal'));
      localStorage.setItem('changeChain', false)
    }
  }, [ dispatch, walletEnabled, wrongNetwork ])

  function resetSelection() {
    dispatchSetWalletMethod(null)
    setWalletEnabled(false)
    setAccountEnabled(false)
  }

  // defines the set of possible networks
  const networks = getAllNetworks()

  let allNetworks = []
  for (var prop in networks) allNetworks.push(prop)

  if (!wrongNetwork && !enabled && isChangingChain) {
    console.log(['wrongNetwork',wrongNetwork ],[' enabled', enabled],[' isChangingChain', isChangingChain])
    return <Root>
      <Typography>Switching Chain...</Typography>
    </Root>
  }

  return (
    <>
      <WrongNetworkModal
        open={wrongNetworkModalState}
        onClose={resetSelection}
      />
      <Root>
        {isButton ? <>
          <Button
            type="primary"
            variant="contained"
            onClick={() => dispatchSetWalletMethod('browser')}
          >
            Connect To Metamask
          </Button>
        </> : <> {!maintenance &&
          <Container maxWidth="md">
            <Grid container spacing={8}>
              <Grid item xs={12} md={6}>
                <Typography variant="h1" component="h1">
                  Connect a Wallet to access BOBA
                </Typography>
                <S.Subtitle variant="body1" component="p" paragraph={true}>
                  Select a wallet to connect to BOBA
                </S.Subtitle>
              </Grid>

              <Grid item xs={12} md={6}>
                <S.WalletCard
                  pulsate={true} onClick={() => dispatchSetWalletMethod('browser')} isMobile={isMobile}>
                  <S.WalletCardHeading>
                    <S.WalletCardTitle>
                      <S.PlusIcon>+</S.PlusIcon>
                      <Typography variant="h2" component="h2" paragraph={true} mb={0}>
                        Metamask
                      </Typography>
                    </S.WalletCardTitle>
                    <Typography variant="body1" component="p" gutterBottom paragraph={true} mb={0}>
                      Connect using <strong>browser </strong>wallet
                    </Typography>
                  </S.WalletCardHeading>

                  <S.WalletCardDescription>
                    <Fox width={isMobile ? 100 : 50} />
                  </S.WalletCardDescription>
                </S.WalletCard>
              </Grid>
            </Grid>
          </Container>
        }
          {!!maintenance &&
            <Container maxWidth="md">
              <Grid container spacing={1}>
                <Grid item xs={12} md={12}>
                  <Typography variant="h1" component="h1">
                    SCHEDULED BOBA GATEWAY DOWNTIME
                  </Typography>
                  <S.Subtitle variant="body1" component="p" paragraph={true}>
                    As announced in Twitter and in Telegram, due to unexpectely high demand for the
                    Boba L2, BOBA liquidity pools are being rebalanced.
                  </S.Subtitle>
                  <S.Subtitle variant="body1" component="p" paragraph={true}>
                    The scheduled maintenance window is from Nov. 4 21:00 UTC to approximately 23:00 UTC.
                    Upgrade status and progress reports will be provided via Twitter and Telegram.
                  </S.Subtitle>
                </Grid>
              </Grid>
            </Container>
          }</>}

      </Root>
    </>
  );
}
export default React.memo(WalletPicker)
