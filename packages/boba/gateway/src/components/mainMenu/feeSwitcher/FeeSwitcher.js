
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

import { Typography } from '@mui/material'
import { switchFee } from 'actions/setupAction.js'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  selectAccountEnabled, 
  selectBobaFeeChoice, 
  selectBobaPriceRatio 
} from 'selectors/setupSelector'
import * as S from './FeeSwitcher.styles.js'

function FeeSwitcher() {

  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())

  const dispatchSwitchFee = useCallback((targetFee) => {
    dispatch(switchFee(targetFee))
  }, [ dispatch ])

  if (!accountEnabled) {
    return null
  }

  return (
    <S.FeeSwitcherWrapper>
    <S.FeeSwitcherLeft>
      {!!feeUseBoba && 
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Fee Token: BOBA</Typography>
      }
      {!feeUseBoba && 
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Fee Token: ETH</Typography>
      }
      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} >Price Ratio: <span style={{opacity: 0.3}}>{feePriceRatio}</span></Typography>
      </S.FeeSwitcherLeft>
      <S.FeeSwitcherRight>
        {!!feeUseBoba && 
        <Typography variant="body2"
          onClick={() => { dispatchSwitchFee('ETH') }}
          sx={{
            textDecoration: 'underline',
            opacity: 0.6,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Change to ETH
        </Typography>
      }
      {!feeUseBoba && 
        <Typography variant="body2"
          onClick={() => { dispatchSwitchFee('BOBA') }}
          sx={{
            textDecoration: 'underline',
            opacity: 0.6,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Change to BOBA
        </Typography>
      }
      </S.FeeSwitcherRight>
    </S.FeeSwitcherWrapper>)
}

export default FeeSwitcher
