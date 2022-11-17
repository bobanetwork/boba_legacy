
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

import { Typography, useMediaQuery, ToggleButtonGroup, ToggleButton, IconButton } from '@mui/material'
import { useTheme } from '@mui/styles'
import { setConnect, setLayer } from 'actions/setupAction.js'
import BobaIcon from 'components/icons/BobaIcon.js'
import EthereumIcon from 'components/icons/EthereumIcon.js'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  selectAccountEnabled,
  selectLayer,
  selectConnectETH,
  selectConnectBOBA,
  selectConnect
} from 'selectors/setupSelector'

import {selectNetwork} from 'selectors/networkSelector'
import * as S from './LayerSwitcher.styles.js'

import networkService from 'services/networkService'
import truncate from 'truncate-middle'

import {
  setEnableAccount,
  setWalletAddress,
} from 'actions/setupAction'

import {
  fetchTransactions,
  fetchBalances
} from 'actions/networkAction'

import { openModal } from 'actions/uiAction'
import Button from 'components/button/Button.js'

function LayerSwitcher({
  visisble = true
}) {

  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())

  let layer = useSelector(selectLayer())
  const network = useSelector(selectNetwork())

  const connectETHRequest = useSelector(selectConnectETH())
  const connectBOBARequest = useSelector(selectConnectBOBA())
  const connectRequest = useSelector(selectConnect())

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const wAddress = networkService.account ? truncate(networkService.account, 6, 4, '...') : ''

  const chainChangedFromMM = JSON.parse(localStorage.getItem('chainChangedFromMM'))
  const wantChain = JSON.parse(localStorage.getItem('wantChain'))
  const chainChangedInit = JSON.parse(localStorage.getItem('chainChangedInit'))

  const dispatchBootAccount = useCallback(() => {

    if (!accountEnabled) initializeAccount()

    async function initializeAccount() {

      const initialized = await networkService.initializeAccount(network)

      console.log("initialized:",initialized)

      if (initialized === 'wrongnetwork') {
        dispatch(openModal('wrongNetworkModal'))
        return false
      }
      else if (initialized === false) {
        console.log("WP: Account NOT enabled for", network, accountEnabled)
        dispatch(setEnableAccount(false))
        return false
      }
      else if (initialized === 'L1' || initialized === 'L2') {
        console.log("WP: Account IS enabled for", initialized)
        dispatch(setLayer(initialized))
        dispatch(setEnableAccount(true))
        dispatch(setWalletAddress(networkService.account))
        dispatch(fetchTransactions())
        dispatch(fetchBalances())
        return true
      }
      else {
        return false
      }
    }

  }, [ dispatch, accountEnabled, network ])

  // this will switch chain, if needed, and then connect to Boba
  const connectToBOBA = useCallback(() => {
    localStorage.setItem('wantChain', JSON.stringify('L2'))
    networkService.switchChain('L2')
    dispatchBootAccount()
  }, [dispatchBootAccount])

   // this will switch chain, if needed, and then connect to Ethereum
  const connectToETH = useCallback(() => {
    localStorage.setItem('wantChain', JSON.stringify('L1'))
    networkService.switchChain('L1')
    dispatchBootAccount()
  }, [dispatchBootAccount])

  const dispatchSwitchLayer = useCallback((targetLayer) => {

    if (targetLayer === 'L1') {
       connectToETH()
    }
    else if (targetLayer === 'L2') {
      connectToBOBA()
    } else {
      // handles the strange targetLayer === null when people click on ETH icon a second time
      connectToETH()
    }

  }, [ connectToBOBA, connectToETH ])

  useEffect(() => {
    // detect mismatch and correct the mismatch
    if (wantChain === 'L1' && layer === 'L2') {
      dispatchBootAccount()
    }
    else if (wantChain === 'L2' && layer === 'L1')
    {
      dispatchBootAccount()
    }
  }, [ wantChain, layer, dispatchBootAccount ])

  useEffect(() => {
    // auto reconnect to MM if we just switched chains from
    // with the chain switcher, and then unset the flag.
    if (chainChangedInit) {
      dispatchBootAccount()
      localStorage.setItem('chainChangedInit', false)
    }
  }, [ chainChangedInit, dispatchBootAccount ])

  useEffect(() => {
    // auto reconnect to MM if we just switched chains from
    // inside MM, and then unset the flag.
    if (chainChangedFromMM) {
      dispatchBootAccount()
      localStorage.setItem('chainChangedFromMM', false)
    }
  }, [ chainChangedFromMM, dispatchBootAccount ])

  useEffect(() => {
    if(connectETHRequest) {
      localStorage.setItem('wantChain', JSON.stringify('L1'))
      networkService.switchChain('L1')
      dispatchBootAccount()
    }
  }, [ connectETHRequest, dispatchBootAccount ])

  useEffect(() => {
    if (connectBOBARequest) {
      localStorage.setItem('wantChain', JSON.stringify('L2'))
      networkService.switchChain('L2')
      dispatchBootAccount()
    }
  }, [ connectBOBARequest, dispatchBootAccount ])

  useEffect(() => {
    if(connectRequest) {
      dispatchBootAccount()
    }
  }, [ connectRequest, dispatchBootAccount ])

  if (!visisble) {
    return null
  }

  const MobileLayer = ({layer, title, icon, onConnect, isConnected}) => {
    return <S.LayerWrapper>
      <IconButton
        sx={{ gap: '5px' }}
        aria-label="eth"
      >
        {icon}
      </IconButton>
      <S.LayerContent>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >{title} </Typography>
        <S.Label >{(layer === 'L1' || layer === 'L2')? wAddress : 'Not Connected' }</S.Label>
      </S.LayerContent>
      {!layer ?
        <Button
          type="primary"
          variant="contained"
          size='small'
          onClick={() => dispatch(setConnect(true))}
        >
          Connect
        </Button> : !isConnected ?
        <Button
          type="primary"
          variant="contained"
          size='small'
          onClick={onConnect}
        >
          Switch
        </Button> : null}
    </S.LayerWrapper>
  }

  if (isMobile) {
    return (
      <S.LayerSwitcherWrapperMobile>
        <MobileLayer title="Ethereum" layer={layer} icon={<EthereumIcon />}
          onConnect={() => connectToETH()}
          isConnected={layer === 'L1'}
        />
        <S.LayerDivider />
        <MobileLayer title="Boba Network" layer={layer} icon={<BobaIcon />}
          onConnect={() => connectToBOBA()}
          isConnected={layer === 'L2'}
        />
      </S.LayerSwitcherWrapperMobile>
    )
  }

  return (
    <S.LayerSwitcherWrapper >
      <ToggleButtonGroup
        value={layer}
        exclusive
        onChange={(e, n) => dispatchSwitchLayer(n)}
        aria-label="text alignment"
      >
        <ToggleButton sx={{p: "5px 10px", borderRadius: '12px 0 0 12px'}} value="L1" aria-label="L1">
          <EthereumIcon selected={layer === 'L1'}/>
        </ToggleButton>
        <ToggleButton sx={{p: "5px 10px", borderRadius: '0 12px 12px 0'}} value="L2" aria-label="L2">
          <BobaIcon selected={layer === 'L2'} />
        </ToggleButton>
      </ToggleButtonGroup>
      {layer === 'L1' ? <S.LayerContent>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Ethereum</Typography>
        <Typography component='p' variant="body4" sx={{ opacity: 0.3 }} >{wAddress}</Typography>
      </S.LayerContent> : null}
      {!layer ? <S.LayerContent>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Not connected</Typography>
        <Typography variant="body4" sx={{
          opacity: '0.3',
          whiteSpace: 'nowrap'
        }} >Select chain to connect</Typography>
      </S.LayerContent> : null}
      {layer === 'L2' ? <S.LayerContent>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Boba</Typography>
        <Typography component='p' variant="body4" sx={{ opacity: 0.3 }} >{wAddress}</Typography>
      </S.LayerContent> : null}
    </S.LayerSwitcherWrapper>)
}

export default LayerSwitcher
