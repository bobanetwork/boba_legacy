
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
import { switchFee, switchFeeMetaTransaction } from 'actions/setupAction.js'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAccountEnabled,
  selectBobaFeeChoice,
  selectLayer
} from 'selectors/setupSelector'
import * as S from './FeeSwitcher.styles.js'
import Select from 'components/select/Select'
import Tooltip from 'components/tooltip/Tooltip.js'


function FeeSwitcher() {

  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  // const feePriceRatio = useSelector(selectBobaPriceRatio())

  const layer = useSelector(selectLayer());

  const dispatchSwitchFee = useCallback((targetFee) => {
    /*
    if(account.ETH === too small && switching to BOBA) {
      dispatch(switchFeeMetaTransaction())
    } else {
    */
      dispatch(switchFee(targetFee))
    //}
  }, [ dispatch ])

  if (!accountEnabled || layer !== 'L2') {
    return null
  }

  return (
    <S.FeeSwitcherWrapper>
      <Typography variant="body2">Fee</Typography>
      <Tooltip
        title={'BOBA or ETH will be used across Boba according to your choice.'}
        >
        <Typography variant="body2">Fee</Typography>
      </Tooltip>
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
