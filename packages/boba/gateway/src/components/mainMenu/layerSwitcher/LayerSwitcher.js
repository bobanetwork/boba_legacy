
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

import React, { useCallback } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import * as S from './LayerSwitcher.styles.js'
import { selectLayer, selectAccountEnabled, selectJustSwitchedChain } from 'selectors/setupSelector'

import { Box, Typography } from '@mui/material'
import Button from 'components/button/Button'

import LayerIcon from 'components/icons/LayerIcon'
import { switchChain } from 'actions/setupAction.js'

function LayerSwitcher({ isButton = false, size }) {

  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())
  const justSwitchedChain = useSelector(selectJustSwitchedChain())
  let layer = useSelector(selectLayer())

  console.log("LS: Layer:", layer)
  console.log("LS: accountEnabled:", accountEnabled)
  console.log("LS: justSwitchedChain:", justSwitchedChain)

  const dispatchSwitchLayer = useCallback(() => {
    console.log("LS: switchLayer accountEnabled:", accountEnabled)
    if(!accountEnabled) return
    //dispatch(setLayer(layer))
    if(layer === 'L1')
      dispatch(switchChain('L2'))
    else if (layer === 'L2')
      dispatch(switchChain('L1'))
  }, [ dispatch, accountEnabled, layer ])

  if (!!isButton) {
    return (
    <>
      <Button
        onClick={() => { dispatchSwitchLayer() }}
        size={size}
        variant="contained"
        >
          SWITCH LAYER
      </Button>
    </>)
  }

  // we are not connected to MM so Layer is not defined
  if (accountEnabled !== true) {
    return (
    <S.WalletPickerContainer>
      <S.WalletPickerWrapper>
        <Box sx={{display: 'flex', width: '100%', alignItems: 'center'}}>
          <LayerIcon />
          <S.Label variant="body2">Layer</S.Label>
          <Typography
            className={'active'}
            variant="body2"
            component="span"
            color="white"
            style={{paddingLeft: '30px', fontSize: '0.7em', lineHeight: '0.9em'}}
          >
            Wallet not<br/>connected
          </Typography>
        </Box>
      </S.WalletPickerWrapper>
    </S.WalletPickerContainer>)
  }

  return (
    <S.WalletPickerContainer>
      <S.WalletPickerWrapper>
        <Box sx={{display: 'flex', width: '100%', alignItems: 'center'}}>
          <LayerIcon />
          <S.Label variant="body2">Layer</S.Label>
          <S.LayerSwitch>
            <Typography
              className={layer === 'L1' ? 'active': ''}
              onClick={()=>{if(layer === 'L2'){dispatchSwitchLayer()}}}
              variant="body2"
              component="span"
              color="white">
                1
            </Typography>
            <Typography
              className={layer === 'L2' ? 'active': ''}
              onClick={()=>{if(layer === 'L1'){dispatchSwitchLayer()}}}
              variant="body2"
              component="span"
              color="white">
                2
            </Typography>
          </S.LayerSwitch>
        </Box>
      </S.WalletPickerWrapper>
    </S.WalletPickerContainer>
  )
}

export default LayerSwitcher
