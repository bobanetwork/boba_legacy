
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

import {
  Typography,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
} from '@mui/material'
import { useTheme } from '@mui/styles'
import { setConnect, setWalletConnected, setConnectBOBA, setConnectETH, setLayer } from 'actions/setupAction.js'
import BobaIcon from 'components/icons/BobaIcon.js'
import EthereumIcon from 'components/icons/EthereumIcon.js'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  selectBaseEnabled,
  selectAccountEnabled,
  selectLayer,
  selectConnectETH,
  selectConnectBOBA,
  selectConnect,
  selectWalletConnected,
  selectChainIdChanged,
} from 'selectors/setupSelector'

import {
  selectActiveNetwork,
  selectActiveNetworkIcon,
  selectActiveNetworkName,
  selectActiveNetworkType,
} from 'selectors/networkSelector'
import * as S from './LayerSwitcher.styles.js'

import networkService from 'services/networkService'
import truncate from 'truncate-middle'

import { setEnableAccount, setWalletAddress } from 'actions/setupAction'

import { fetchTransactions } from 'actions/networkAction'

import { closeModal, openModal } from 'actions/uiAction'
import Button from 'components/button/Button.js'
import { L1_ICONS, L2_ICONS } from 'util/network/network.util.js'
import { LAYER, DISABLE_WALLETCONNECT } from 'util/constant.js'

function LayerSwitcher({ visisble = true, isButton = false }) {
  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())
  const baseEnabled = useSelector(selectBaseEnabled())

  let layer = useSelector(selectLayer())
  const network = useSelector(selectActiveNetwork())
  const networkType = useSelector(selectActiveNetworkType())
  const networkName = useSelector(selectActiveNetworkName())
  const networkIcon = useSelector(selectActiveNetworkIcon())

  const L1Icon = L1_ICONS[networkIcon]
  const L2Icon = L2_ICONS[networkIcon]

  const connectETHRequest = useSelector(selectConnectETH())
  const connectBOBARequest = useSelector(selectConnectBOBA())
  const connectRequest = useSelector(selectConnect())
  const walletConnected = useSelector(selectWalletConnected())
  const chainIdChanged = useSelector(selectChainIdChanged())

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const wAddress = networkService.account
    ? truncate(networkService.account, 6, 4, '...')
    : ''

  const dispatchBootAccount = useCallback(() => {
    if ((!accountEnabled && baseEnabled) || chainIdChanged) initializeAccount()

    async function initializeAccount() {

      const initialized = await networkService.initializeAccount({
        networkGateway: network,
        networkType,
        chainIdChanged,
      })
      if (initialized === 'nometamask') {
        dispatch(openModal('noMetaMaskModal'));
        return false;
      } else if (initialized === 'wrongnetwork') {
        dispatch(openModal('wrongNetworkModal'))
        return false
      }
      else if (initialized === false) {
        dispatch(setEnableAccount(false))
        return false
      }
      else if (initialized === LAYER.L1 || initialized === LAYER.L2) {
        dispatch(closeModal('wrongNetworkModal'))
        dispatch(setLayer(initialized))
        dispatch(setEnableAccount(true))
        dispatch(setWalletAddress(networkService.account))
        dispatch(fetchTransactions())
        return true
      } else {
        return false
      }
    }
  }, [dispatch, accountEnabled, network, networkType, baseEnabled, chainIdChanged])

  const doConnectToLayer = useCallback((layer) => {
    function resetConnectChain() {
      dispatch(setConnect(false))
      dispatch(setConnectETH(false))
    }

    async function doConnect() {
      try {
        if (networkService.walletService.provider) {
          if (await networkService.switchChain(layer)) {
            if (layer === 'L1') {
              dispatch(setConnectBOBA(false))
            } else {
              dispatch(setConnectETH(false))
            }
            dispatchBootAccount()
          } else {
            resetConnectChain()
          }
        } else {
          // bypass walletSelectorModal
          if (DISABLE_WALLETCONNECT) {
            if (await networkService.walletService.connectWallet('metamask')) {
              dispatch(setWalletConnected(true))
            } else {
              resetConnectChain()
            }
          } else {
            resetConnectChain()
            dispatch(openModal('walletSelectorModal'))
          }
        }
      } catch (err) {
        console.log('ERROR', err)
        resetConnectChain()
      }
    }
    doConnect();
  }, [dispatch, dispatchBootAccount])

  useEffect(() => {
    if (walletConnected) {
      dispatchBootAccount()
    }
  }, [walletConnected, dispatchBootAccount])

  useEffect(() => {
    // detect mismatch and correct the mismatch
    if (layer === 'L1' || layer === 'L2') {
      dispatchBootAccount()
    }
  }, [layer, dispatchBootAccount])

  // listening for l1 connection request
  useEffect(() => {
    if (connectETHRequest) {
      doConnectToLayer('L1')
    }
  }, [ connectETHRequest, doConnectToLayer ])

  // listening for l2 connection request
  useEffect(() => {
    if (connectBOBARequest) {
      doConnectToLayer('L2')
    }
  }, [ connectBOBARequest, doConnectToLayer ])

  useEffect(() => {
    if (connectRequest && !networkService.walletService.provider) {
      // bypass walletSelectorModal
      if (DISABLE_WALLETCONNECT) {
        dispatchBootAccount()
      } else {
        dispatch(openModal('walletSelectorModal'))
      }
    }
  }, [dispatch, connectRequest, dispatchBootAccount])

  if (!visisble) {
    return null
  }

  const MobileLayer = ({ layer, title, icon, onConnect, isConnected }) => {
    return (
      <S.LayerWrapper>
        <IconButton sx={{ gap: '5px' }} aria-label="eth">
          {icon}
        </IconButton>
        <S.LayerContent>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            {title}{' '}
          </Typography>
          <S.Label>
            {layer === LAYER.L1 || layer === LAYER.L2
              ? wAddress
              : 'Not Connected'}
          </S.Label>
        </S.LayerContent>
        {!layer ? (
          <Button
            type="primary"
            variant="contained"
            size="small"
            onClick={() => dispatch(setConnect(true))}
          >
            Connect
          </Button>
        ) : !isConnected ? (
          <Button
            type="primary"
            variant="contained"
            size="small"
            onClick={onConnect}
          >
            Switch
          </Button>
        ) : null}
      </S.LayerWrapper>
    )
  }

  if (isButton && layer) {
    return (
      <Button
        type="primary"
        variant="contained"
        size="small"
        newStyle
        onClick={() => (layer === 'L1') ?  dispatch(setConnectBOBA(true)) : dispatch(setConnectETH(true))}
        sx={{ fontWeight: '500;' }}
      >
        Connect to {networkName[ layer === 'L1' ? 'l2': 'l1' ]}
      </Button>
    )
  }

  if (isMobile) {
    return (
      <S.LayerSwitcherWrapperMobile>
        <MobileLayer
          title="Ethereum"
          layer={layer}
          icon={<EthereumIcon />}
          onConnect={() => doConnectToLayer(LAYER.L1)}
          isConnected={layer === LAYER.L1}
        />
        <S.LayerDivider />
        <MobileLayer
          title="Boba Network"
          layer={layer}
          icon={<BobaIcon />}
          onConnect={() => doConnectToLayer(LAYER.L1)}
          isConnected={layer === LAYER.L2}
        />
      </S.LayerSwitcherWrapperMobile>
    )
  }

  return (
    <S.LayerSwitcherWrapper >
      <ToggleButtonGroup
        value={layer}
        exclusive
        onChange={(e, n) => doConnectToLayer(n)}
        aria-label="text alignment"
      >
        <ToggleButton
          sx={{
            p: '7px',
            borderRadius: '12px',
            border: 'none',
            '&:hover': {
              background: 'none',
            },
          }}
          value="L1"
          aria-label="L1"
        >
          <L1Icon selected={layer === LAYER.L1} />
        </ToggleButton>
        <ToggleButton
          sx={{
            p: '7px 7px 7px 3.5px',
            borderRadius: '12px',
            border: 'none',
            '&:hover': {
              background: 'none',
            },
          }}
          value="L2"
          aria-label="L2"
        >
          <L2Icon selected={layer === LAYER.L2} />
        </ToggleButton>
      </ToggleButtonGroup>
      {layer === 'L1' ? (
        <S.LayerContent>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            Ethereum
          </Typography>
          <Typography component="p" variant="body4" sx={{ opacity: 0.3 }}>
            {wAddress}
          </Typography>
        </S.LayerContent>
      ) : null}
      {!layer ? (
        <S.LayerContent>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: '500' }}>
            Connect
          </Typography>
          <Typography
            variant="body4"
            sx={{
              opacity: '0.3',
              whiteSpace: 'nowrap',
            }}
          >
            connect wallet
          </Typography>
        </S.LayerContent>
      ) : null}
      {layer === 'L2' ? (
        <S.LayerContent>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            Boba
          </Typography>
          <Typography component="p" variant="body4" sx={{ opacity: 0.3 }}>
            {wAddress}
          </Typography>
        </S.LayerContent>
      ) : null}
    </S.LayerSwitcherWrapper>
  )
}

export default LayerSwitcher
