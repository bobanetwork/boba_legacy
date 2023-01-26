
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

import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { openError, openAlert } from 'actions/uiAction'

import {
  selectBobaFeeChoice,
  selectLayer
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

import networkService from 'services/networkService'

function FeeSwitcher() {

  const dispatch = useDispatch()
  const feeUseBoba = useSelector(selectBobaFeeChoice())

  const layer = useSelector(selectLayer())

  const l2Balances = useSelector(selectlayer2Balance, isEqual)

  const l2BalanceL1NativeToken = l2Balances.filter((i) => i.symbol === networkService.L1NativeTokenSymbol)
  const balanceL1NativeToken = l2BalanceL1NativeToken[0]

  const l2BalanceBOBA = l2Balances.filter((i) => i.symbol === 'BOBA')
  const balanceBOBA = l2BalanceBOBA[0]

  const dispatchSwitchFee = useCallback(async (targetFee) => {

    console.log("balanceBOBA:",balanceBOBA)
    console.log("balanceL1NativeToken:",balanceL1NativeToken)

    console.log("feeUseBoba:",feeUseBoba)
    console.log("targetFee:",targetFee)

    /*
    warning - feeUseBoba is flipped compared to its usual meaning
    */

    const usingBOBA = !feeUseBoba

    let tooSmallL1NativeToken = false
    let tooSmallBOBA = false

    if(typeof(balanceBOBA) === 'undefined') {
      tooSmallBOBA = true
    } else {
      //check actual balance
      tooSmallBOBA = new BN(logAmount(balanceBOBA.balance, 18)).lt(new BN(1))
    }

    if(typeof(balanceL1NativeToken) === 'undefined') {
      tooSmallL1NativeToken = true
    } else {
      //check actual balance
      tooSmallL1NativeToken = new BN(logAmount(balanceL1NativeToken.balance, 18)).lt(new BN(0.002))
    }

    if (!balanceBOBA && !balanceL1NativeToken) {
      dispatch(openError(`Wallet empty - please bridge in ${networkService.L1NativeTokenSymbol} or BOBA from L1`))
      return
    }

    let res


    /*
    warning - feeUseBoba is flipped compared to its usual meaning
    */

    if ( usingBOBA && targetFee === 'BOBA' ) {
      // do nothing - already set to BOBA
    }
    else if ( !usingBOBA && targetFee === networkService.L1NativeTokenSymbol ) {
      // do nothing - already set to L1NativeToken
    }
    else if ( usingBOBA && targetFee === networkService.L1NativeTokenSymbol ) {
      // change to L1NativeToken
      if( tooSmallL1NativeToken ) {
        dispatch(openError(`You cannot change the fee token to ${networkService.L1NativeTokenSymbol} since your ${networkService.L1NativeTokenSymbol} balance is below 0.5.
          If you change fee token now, you might get stuck. Please obtain some ${networkService.L1NativeTokenSymbol} first.`))
      } else {
        res = await dispatch(switchFee(targetFee))
      }
    }
    else if ( !usingBOBA && targetFee === 'BOBA' ) {
      // change to BOBA
      if( tooSmallBOBA ) {
        dispatch(openError(`You cannot change the fee token to BOBA since your BOBA balance is below 1.
          If you change fee token now, you might get stuck. Please obtain some BOBA first.`))
      } else {
        res = await dispatch(switchFee(targetFee))
      }
    }

    if (res) {
      dispatch(openAlert(`Successfully changed fee to ${targetFee}`))
    }

  }, [ dispatch, feeUseBoba, balanceL1NativeToken, balanceBOBA ])

  if (layer !== 'L2') {
    return <S.FeeSwitcherWrapper>
      <Tooltip title={`After switching to the Boba network, you can modify the Gas fee token used by the Boba network. The whole network will use BOBA or ${networkService.L1NativeTokenSymbol} as the gas fee token according to your choice.`}>
        <HelpOutline sx={{ opacity: 0.65 }} fontSize="small" />
      </Tooltip>
      <Typography variant="body2">Fee</Typography>
    </S.FeeSwitcherWrapper>
  }

  return (
    <S.FeeSwitcherWrapper>
      <Tooltip title={`BOBA or ${networkService.L1NativeTokenSymbol} will be used across ${networkService.L1ChainAsset.l2Name} according to your choice.`}>
        <HelpOutline sx={{ opacity: 0.65 }} fontSize="small" />
      </Tooltip>
      <Typography variant="body2">Fee</Typography>
      <Select
        onSelect={(e, d) => {
          dispatchSwitchFee(e.target.value)
        }}
        value={!feeUseBoba ? "BOBA" : networkService.L1NativeTokenSymbol}
        options={[ {
          value: 'BOBA',
          title: 'BOBA',
        },
        {
          value: networkService.L1NativeTokenSymbol,
          title: networkService.L1NativeTokenSymbol,
        }
        ]}
      />
    </S.FeeSwitcherWrapper>
  )

}

export default FeeSwitcher
