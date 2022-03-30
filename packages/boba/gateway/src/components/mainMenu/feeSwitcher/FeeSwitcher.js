
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
  selectLayer
} from 'selectors/setupSelector'
import * as S from './FeeSwitcher.styles.js'
import Select from 'components/select/Select'


function FeeSwitcher() {

  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  // const feePriceRatio = useSelector(selectBobaPriceRatio())

  const layer = useSelector(selectLayer());

  const dispatchSwitchFee = useCallback((targetFee) => {
    dispatch(switchFee(targetFee))
  }, [ dispatch ])

  if (!accountEnabled || layer !== 'L2') {
    return null
  }

  return (
    <S.FeeSwitcherWrapper>
      <Typography variant="body2">Fee</Typography>
      <Select
        onSelect={(e, d) => {
          dispatchSwitchFee(e.target.value)
        }}
        value={ !feeUseBoba ? "ETH" : 'BOBA'}
        options={[ {
          value: 'ETH',
          title: 'ETH',
        },
        {
          value: 'BOBA',
          title: 'BOBA',
        }
        ]}
      />
    </S.FeeSwitcherWrapper>
  )

}

export default FeeSwitcher
