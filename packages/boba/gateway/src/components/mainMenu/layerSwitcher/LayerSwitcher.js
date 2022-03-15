
/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { IconButton, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/styles'
import { switchChain, setLayer } from 'actions/setupAction.js'
import BobaIcon from 'components/icons/BobaIcon.js'
import EthereumIcon from 'components/icons/EthereumIcon.js'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector'
import * as S from './LayerSwitcher.styles.js'

import networkService from 'services/networkService'
import truncate from 'truncate-middle'
import WalletPicker from 'components/walletpicker/WalletPicker.js'
import Button from 'components/button/Button.js'

function LayerSwitcher({ isIcon= false, isButton = false, size, fullWidth = false }) {

  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())

  let layer = useSelector(selectLayer())

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const wAddress = networkService.account ? truncate(networkService.account, 6, 4, '...') : ''

  const dispatchSwitchLayer = useCallback((targetLayer) => {
    dispatch(setLayer(layer))
    if (!layer && targetLayer === 'L1') {
      dispatch(switchChain('L1'))
    }
    else if (!layer && targetLayer === 'L2') {
      dispatch(switchChain('L2'))
    }
    else if (layer === 'L1' && targetLayer === 'L2') {
      dispatch(setLayer(null))
      dispatch(switchChain('L2'))
    }
    else if (layer === 'L2' && targetLayer === 'L1') {
      dispatch(setLayer(null))
      dispatch(switchChain('L1'))
    }
    else {
      // do nothing - we are on the correct chain
    }
  }, [ dispatch, layer ])


  if (!accountEnabled) {
    return null
  }

  if (isButton) {
    return (
      <S.LayerSwitcherWrapperMobile>
        <S.LayerWrapper>
          {!layer ? <WalletPicker /> : layer === 'L1' ?
            <Button
              type="primary"
              variant="contained"
              size='small'
              fullWidth={fullWidth}
              onClick={() => dispatchSwitchLayer('L2')}
            >
              Switch
            </Button> :
            <Button
              type="primary"
              variant="contained"
              size='small'
              fullWidth={fullWidth}
              onClick={() => dispatchSwitchLayer('L1')}
            >
              Switch
            </Button>
          }
        </S.LayerWrapper>
      </S.LayerSwitcherWrapperMobile>
    )
  }

  if (isIcon) {
    return (
      <S.LayerSwitcherIconWrapper>
        {layer === 'L1' ?
          <S.LayerSwitcherIcon
            size='small'
            fullWidth={fullWidth}
            onClick={() => dispatchSwitchLayer('L2')}
          >
            <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.13029 20L4.47765 15.3474L9.13029 10.6947L9.13029 13.3732L11.1035 13.3732C15.4911 13.3723 18.1237 12.0569 19 9.425C18.1231 14.6886 15.4902 17.3215 11.1046 17.3206L9.13051 17.3215C9.13029 17.3215 9.13029 20 9.13029 20ZM10.5061 7.42559e-07L15.1588 4.65264L10.507 9.3044L10.5052 6.62743L8.53266 6.62654C4.14506 6.62743 1.51245 7.94285 0.635512 10.5757C1.51334 5.31113 4.14617 2.67853 8.53199 2.67919L10.5061 2.6783L10.5061 7.42559e-07Z" fill="white" fillOpacity="0.85"/>
            </svg>
          </S.LayerSwitcherIcon> :
          <S.LayerSwitcherIcon
            size='small'
            fullWidth={fullWidth}
            onClick={() => dispatchSwitchLayer('L1')}
          >
            <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.13029 20L4.47765 15.3474L9.13029 10.6947L9.13029 13.3732L11.1035 13.3732C15.4911 13.3723 18.1237 12.0569 19 9.425C18.1231 14.6886 15.4902 17.3215 11.1046 17.3206L9.13051 17.3215C9.13029 17.3215 9.13029 20 9.13029 20ZM10.5061 7.42559e-07L15.1588 4.65264L10.507 9.3044L10.5052 6.62743L8.53266 6.62654C4.14506 6.62743 1.51245 7.94285 0.635512 10.5757C1.51334 5.31113 4.14617 2.67853 8.53199 2.67919L10.5061 2.6783L10.5061 7.42559e-07Z" fill="white" fillOpacity="0.85"/>
            </svg>
          </S.LayerSwitcherIcon>
        }
      </S.LayerSwitcherIconWrapper>
    )
  }

  if (isMobile) {
    return (
      <S.LayerSwitcherWrapperMobile>
        <S.LayerWrapper>
          <IconButton
            sx={{ gap: '5px' }}
            aria-label="eth"
          >
            <EthereumIcon />
          </IconButton>
          <S.LayerContent>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Ethereum</Typography>
            {layer === 'L1' ?
              <Typography component='p' variant="body4" sx={{
                color: 'rgba(255, 255, 255, 0.3)'
              }} >{wAddress}</Typography> :
              <Typography variant="body4" sx={{
                opacity: '0.3',
                whiteSpace: 'nowrap'
              }} >Not Connected</Typography>
            }
          </S.LayerContent>
          {!layer ? <WalletPicker /> : layer === 'L1' ? null :
            <Button
              type="primary"
              variant="contained"
              size='small'
              onClick={() => dispatchSwitchLayer('L1')}
            >
              Switch
            </Button>}
        </S.LayerWrapper>
        <S.LayerDivider>
        </S.LayerDivider>
        <S.LayerWrapper>
          <IconButton
            sx={{ gap: '5px' }}
            aria-label="boba"
          >
            <BobaIcon />
          </IconButton>
          <S.LayerContent>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Boba Network</Typography>
            {layer === 'L2' ?
              <Typography component='p' variant="body4" sx={{
                color: 'rgba(255, 255, 255, 0.3)'
              }} >{wAddress}</Typography> :
              <Typography variant="body4" sx={{
                opacity: '0.3',
                whiteSpace: 'nowrap'
              }} >Not Connected</Typography>
            }
          </S.LayerContent>
          {!layer ? <WalletPicker /> : layer === 'L2' ? null :
            <Button
              type="primary"
              variant="contained"
              size='small'
              onClick={() => dispatchSwitchLayer('L2')}
            >
              Switch
            </Button>
          }
        </S.LayerWrapper>
      </S.LayerSwitcherWrapperMobile>
    )
  }

  return (
    <S.LayerSwitcherWrapper>
      <IconButton
        sx={{
          gap: '5px',
          opacity: !layer || layer === 'L2' ? '0.5' :'1',
          border: layer === 'L1' ? 'solid white 3px' : '',
      }}
        onClick={() => { dispatchSwitchLayer('L1') }}
        aria-label="eth"
      >
        <EthereumIcon />
      </IconButton>
      <IconButton
        sx={{
          gap: '5px',
          opacity: !layer || layer === 'L1' ? '0.5' :'1',
          border: layer === 'L2' ? 'solid white 3px' : '',
      }}
        onClick={() => { dispatchSwitchLayer('L2') }}
        aria-label="boba"
      >
        <BobaIcon />
      </IconButton>
      {layer === 'L1' ? <S.LayerContent>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Ethereum</Typography>
        <Typography component='p' variant="body4" sx={{opacity: 0.3}} >{wAddress}</Typography>
      </S.LayerContent> : null}
      {!layer ? <S.LayerContent>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Not connected</Typography>
        <Typography variant="body4" sx={{
          opacity: '0.3',
          whiteSpace: 'nowrap'
        }} >Select chain to connect</Typography>
      </S.LayerContent> : null}
      {layer === 'L2' ? <S.LayerContent>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Boba Network</Typography>
        <Typography component='p' variant="body4" sx={{opacity: 0.3}} >{wAddress}</Typography>
      </S.LayerContent> : null}
    </S.LayerSwitcherWrapper>)
}

export default LayerSwitcher
