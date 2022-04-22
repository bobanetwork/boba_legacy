
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
import { useDispatch, useSelector } from 'react-redux'
import { openError, openAlert } from 'actions/uiAction'

import {
  selectAccountEnabled,
  selectBobaFeeChoice,
  selectLayer,
  selectNetwork,
  selectMonster
} from 'selectors/setupSelector'

import { selectlayer2Balance } from 'selectors/balanceSelector'

import { switchFee } from 'actions/setupAction.js'
import { Typography } from '@mui/material'

import * as S from './FeeSwitcher.styles.js'
import Select from 'components/select/Select'
import Tooltip from 'components/tooltip/Tooltip.js'
import { isEqual } from 'lodash'

import BN from 'bignumber.js'
import { logAmount } from 'util/amountConvert.js'
import { HelpOutline } from '@mui/icons-material'

function FeeSwitcher() {

  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const network = useSelector(selectNetwork())
  const monsterNumber = useSelector(selectMonster())

  const layer = useSelector(selectLayer())

  const l2Balances = useSelector(selectlayer2Balance, isEqual)

  const l2BalanceETH = l2Balances.filter((i) => i.symbol === 'ETH')
  const balanceETH = l2BalanceETH[0]

  const l2BalanceBOBA = l2Balances.filter((i) => i.symbol === 'BOBA')
  const balanceBOBA = l2BalanceBOBA[0]

  const dispatchSwitchFee = useCallback(async (targetFee) => {

    //console.log("balanceBOBA:",balanceBOBA)
    //console.log("balanceETH:",balanceETH)

    let tooSmallETH = false
    let tooSmallBOBA = false

    if(typeof(balanceBOBA) === 'undefined') {
      tooSmallBOBA = true
    } else {
      //check actual balance
      tooSmallBOBA = new BN(logAmount(balanceBOBA.balance, 18)).lt(new BN(3.0))
    }

    if(typeof(balanceETH) === 'undefined') {
      tooSmallETH = true
    } else {
      //check actual balance
      tooSmallETH = new BN(logAmount(balanceETH.balance, 18)).lt(new BN(0.002))
    }

    if (!balanceBOBA && !balanceETH) {
      dispatch(openError('Wallet empty - please bridge in ETH or BOBA from L1'))
      return
    }

    let res

    if (feeUseBoba && targetFee === 'BOBA') {
      // do nothing - already set to BOBA
    }
    else if ( !feeUseBoba && targetFee === 'ETH' ) {
      // do nothing - already set to ETH
    }
    else if ( !feeUseBoba && targetFee === 'BOBA' ) {
      // change to BOBA
      if( tooSmallBOBA ) {
        dispatch(openError(`You cannot change the fee token to BOBA since your BOBA balance is below 3 BOBA.
          If you change fee token now, you might get stuck. Please swap some ETH for BOBA first.`))
      } else {
        res = await dispatch(switchFee(targetFee))
      }
    }
    else if (feeUseBoba && targetFee === 'ETH') {
      // change to ETH
      if( tooSmallETH ) {
        dispatch(openError(`You cannot change the fee token to ETH since your ETH balance is below 0.002 ETH.
          If you change fee token now, you might get stuck. Please swap some BOBA for ETH first.`))
      } else {
        res = await dispatch(switchFee(targetFee))
      }
    }

    if (res) {
      dispatch(openAlert(`Successfully changed fee to ${targetFee}`))
    }

  }, [ dispatch, feeUseBoba, balanceETH, balanceBOBA ])

  if (!accountEnabled) {
    return null
  }

  if (layer !== 'L2') {
    return null
  }

  if (network === 'mainnet' && monsterNumber < 1) {
    return null
  }

  return (
    <S.FeeSwitcherWrapper>
      <Tooltip title={'BOBA or ETH will be used across Boba according to your choice.'}>
        <HelpOutline sx={{ opacity: 0.65 }} fontSize="small" />
      </Tooltip>
      <Typography variant="body2">Fee</Typography>
      <Select
        onSelect={(e, d) => {
          dispatchSwitchFee(e.target.value)
        }}
        value={!feeUseBoba ? "ETH" : 'BOBA'}
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
