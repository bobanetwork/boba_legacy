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
  selectAccountEnabled,
  selectBobaFeeChoice,
  selectLayer,
} from 'selectors/setupSelector'

import { selectlayer2Balance } from 'selectors/balanceSelector'

import { switchFee } from 'actions/setupAction.js'

import * as S from './FeeSwitcher.styles.js'
import Select from 'components/select/Select'
import Tooltip from 'components/tooltip/Tooltip.js'
import { isEqual } from 'util/lodash';

import BN from 'bignumber.js'
import { logAmount } from 'util/amountConvert.js'
import networkService from 'services/networkService.js'
import {
  selectActiveNetworkName,
} from 'selectors/networkSelector.js'
import {FeeSwitcherIcon, FeeSwitcherLabel} from "./FeeSwitcher.styles.js";


function FeeSwitcher() {
  const dispatch = useDispatch()
  const accountEnabled = useSelector(selectAccountEnabled())
  const feeUseBoba = useSelector(selectBobaFeeChoice())

  const networkName = useSelector(selectActiveNetworkName())

  const layer = useSelector(selectLayer())

  const l2Balances = useSelector(selectlayer2Balance, isEqual)

  const l2BalanceNativeToken = l2Balances.filter((i) => i.symbol === networkService.L1NativeTokenSymbol)
  const balanceETH = l2BalanceNativeToken[ 0 ]
  const l2BalanceBOBA = l2Balances.filter((i) => i.symbol === 'BOBA')
  const balanceBOBA = l2BalanceBOBA[0]

  const dispatchSwitchFee = useCallback(
    async (targetFee) => {
      let tooSmallL1NativeToken = false
      // mini balance required for token to use as bridge fee
      let minL1NativeBalance = await networkService.estimateMinL1NativeTokenForFee() //0.002
      let tooSmallBOBA = false

      if (typeof balanceBOBA === 'undefined') {
        tooSmallBOBA = true
      } else {
        //check actual balance
        tooSmallBOBA = new BN(logAmount(balanceBOBA.balance, 18)).lt(new BN(1))
      }

      if (typeof balanceETH === 'undefined') {
        tooSmallL1NativeToken = true
      } else {
        //check actual balance
        tooSmallL1NativeToken = new BN(logAmount(balanceETH.balance, 18)).lt(
          new BN(minL1NativeBalance)
        )
      }

      if (!balanceBOBA && !balanceETH) {
        dispatch(
          openError('Wallet empty - please bridge in ETH or BOBA from L1')
        )
        return
      }

      let res

      if (feeUseBoba && targetFee === 'BOBA') {
        // do nothing - already set to BOBA
      } else if (
        !feeUseBoba &&
        targetFee === networkService.L1NativeTokenSymbol
      ) {
        // do nothing - already set to ETH
      } else if (!feeUseBoba && targetFee === 'BOBA') {
        // change to BOBA
        if (tooSmallBOBA) {
          dispatch(
            openError(`You cannot change the fee token to BOBA since your BOBA balance is below 1 BOBA.
          If you change fee token now, you might get stuck. Please swap some ETH for BOBA first.`)
          )
        } else {
          res = await dispatch(switchFee(targetFee))
        }
      } else if (
        feeUseBoba &&
        targetFee === networkService.L1NativeTokenSymbol
      ) {
        // change to L1Native Token
        if (tooSmallL1NativeToken) {
          dispatch(
            openError(`You cannot change the fee token to ${networkService.L1NativeTokenSymbol} since your ${networkService.L1NativeTokenSymbol} balance is below ${minL1NativeBalance}.
          If you change fee token now, you might get stuck. Please obtain some ${networkService.L1NativeTokenSymbol} first.`)
          )
        } else {
          res = await dispatch(switchFee(targetFee))
        }
      }

      if (res) {
        dispatch(openAlert(`Successfully changed fee to ${targetFee}`))
      }
    },
    [dispatch, feeUseBoba, balanceETH, balanceBOBA]
  )

  if (!accountEnabled && layer !== 'L2') {
    return (
      <S.FeeSwitcherWrapper>
        <Tooltip
          title={`After switching to the Boba network, you can modify the Gas fee token used by the Boba network. The whole network will use BOBA or ${networkService.L1NativeTokenSymbol} as the gas fee token according to your choice.`}
        >
          <FeeSwitcherIcon fontSize="small" />
        </Tooltip>
        <FeeSwitcherLabel variant="body2">Fee</FeeSwitcherLabel>
      </S.FeeSwitcherWrapper>
    )
  }

  return (
    <S.FeeSwitcherWrapper>
      <Tooltip
        title={`BOBA or ${networkService.L1NativeTokenSymbol} will be used across ${networkName['l2']} according to your choice.`}
      >
        <FeeSwitcherIcon fontSize="small" />
      </Tooltip>
      <FeeSwitcherLabel variant="body2">Fee</FeeSwitcherLabel>
      <Select
        onSelect={(e, d) => {
          dispatchSwitchFee(e.target.value)
        }}
        value={!feeUseBoba ? networkService.L1NativeTokenSymbol : 'BOBA'}
        options={[
          {
            value: 'BOBA',
            title: 'BOBA',
          },
          {
            value: networkService.L1NativeTokenSymbol,
            title: networkService.L1NativeTokenName,
          },
        ]}
      />
    </S.FeeSwitcherWrapper>
  )
}

export default FeeSwitcher
