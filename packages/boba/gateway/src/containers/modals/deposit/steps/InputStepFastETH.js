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

import { Typography } from '@material-ui/core'

import Input from 'components/input/Input'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { logAmount, toWei_String } from 'util/amountConvert'

import parse from 'html-react-parser'

import BN from 'bignumber.js'

import {
  fetchFastDepositBatchCost,
  fetchL2LPETHBalance,
  fetchL2LPETHPending,
  fetchL2TotalFeeRate,
  fetchL2ETHFeeRateN,
  fetchL1FeeBalance,
  fetchL2LPETHLiquidity,
 } from 'actions/balanceAction'

import {
  selectFastDepositBatchCost,
  selectL2LPETHBalanceString,
  selectL2LPETHPendingString,
  selectL1FeeBalance,
  selectL2LPETHLiquidity,
  selectL1ETHBalance
} from 'selectors/balanceSelector'

function InputStepFast({
  batchTokenValue,
  batchToken,
  setETHValue,
  setETH_Value_Wei_String,
  setETHValidValue,
  setETHTransactionMessage
}) {

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')

  const [ LPRatio, setLPRatio ] = useState(0)

  const ETHToken = useSelector(selectL1ETHBalance)

  const LPETHBalance = useSelector(selectL2LPETHBalanceString)
  const LPETHPending = useSelector(selectL2LPETHPendingString)
  const LPETHLiquidity = useSelector(selectL2LPETHLiquidity)

  const batchCost = useSelector(selectFastDepositBatchCost)
  const feeBalance = useSelector(selectL1FeeBalance) //amount of ETH on L1 to pay gas

  const maxValue = logAmount(ETHToken.balance, ETHToken.decimals)
  const lpUnits = logAmount(LPETHBalance, ETHToken.decimals)
  const balanceSubPending = lpUnits - logAmount(LPETHPending, ETHToken.decimals) //subtract the in flight exits

  function setAmount(value) {

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(maxValue))

    // console.log("ETH fees:",Number(batchCost))
    // console.log("Transaction token value:",Number(value))
    // console.log("ETH available for paying fees:",Number(feeBalance))
    // console.log("LPRatio:",Number(LPRatio))
    // console.log("LPETHBalance:",Number(balanceSubPending))

    if (tooSmall || tooBig) {
      setETHValidValue(false)
      setValue(value)
      setETHValue(value)
      return false
    } else if (ETHToken.symbol === 'ETH' && (Number(batchCost) + Number(value)) > Number(feeBalance)) {
      //insufficient ETH to cover the ETH amount plus gas
      setETHValidValue(false)
      setValue(value)
      setETHValue(value)
      return false
    } else if ((Number(batchCost) > Number(feeBalance))) {
      //insufficient ETH to pay gas
      setETHValidValue(false)
      setValue(value)
      setETHValue(value)
      return false
    } else if (Number(LPRatio) < 0.1) {
      //not enough balance/liquidity ratio
      //we always want some balance for unstaking
      setETHValidValue(false)
      setValue(value)
      setETHValue(value)
      return false
    } else if (Number(value) > Number(balanceSubPending) * 0.9) {
      //not enough absolute balance
      //we don't want one large bridge to wipe out the entire balance
      //NOTE - this logic still allows bridgers to drain the entire pool, but just more slowly than before
      //this is because the every time someone exits, the limit is recalculated
      //via Number(LPETHBalance) * 0.9, and LPETHBalance changes over time
      setETHValidValue(false)
      setValue(value)
      setETHValue(value)
      return false
    } else {
      //Whew, finally!
      setETHValidValue(true)
      setValue(value)
      setETHValue(value)
      return true
    }

  }

  //ok, we are on L1, but the funds will be paid out on l2
  //goal now is to find out as much as we can about the state of the l2 pools...
  useEffect(() => {
    dispatch(fetchL2LPETHBalance())
    dispatch(fetchL2LPETHLiquidity())
    dispatch(fetchL2LPETHPending()) //lookup is, confusingly, via L1 token address
    dispatch(fetchL2TotalFeeRate())
    dispatch(fetchL2ETHFeeRateN())
    dispatch(fetchFastDepositBatchCost(batchToken.address))
    dispatch(fetchL1FeeBalance()) //ETH balance for paying gas
  }, [ dispatch, batchToken, ETHToken ])

  useEffect(() => {
    const lbl = Number(logAmount(LPETHLiquidity, ETHToken.decimals))
    if(lbl > 0){
      const lbp = Number(logAmount(LPETHBalance, ETHToken.decimals))
      const LPR = lbp / lbl
      setLPRatio(Number(LPR).toFixed(3))
    }
  }, [ LPETHLiquidity, LPETHBalance, ETHToken.decimals ])

  let ETHstring = ''
  let warning = false

  if(batchCost && Number(batchCost) > 0) {

    if((Number(value) + Number(batchCost)) > Number(feeBalance)) {
      warning = true
      ETHstring = `Transaction total (amount + gas): ${Number(batchTokenValue).toFixed(4)} ${batchToken.symbol} and ${(Number(value) + Number(batchCost)).toFixed(4)} ETH
      <br/>WARNING: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover this transaction.
      <br/>THIS TRANSACTION WILL FAIL.`
    }
    else if ((Number(value) + Number(batchCost)) > Number(feeBalance) * 0.96) {
      warning = true
      ETHstring = `Transaction total (amount + gas): ${Number(batchTokenValue).toFixed(4)} ${batchToken.symbol} and ${(Number(value) + Number(batchCost)).toFixed(4)} ETH
      <br/>CAUTION: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated total.
      <br/>THIS TRANSACTION MIGHT FAIL.`
    } else {
      ETHstring = `Transaction total (amount + gas): ${Number(batchTokenValue).toFixed(4)} ${batchToken.symbol} and ${(Number(value) + Number(batchCost)).toFixed(4)} ETH`
    }

    setETHTransactionMessage(
      <Typography variant="body2" sx={warning ? {mt: 2, color: 'red'} : {mt: 2}}>
        {parse(ETHstring)}
      </Typography>
    )
  }

  return (
    <>
        <Input
          label={`Amount to bridge`}
          placeholder="0"
          value={value}
          type="number"
          onChange={(i)=>{
            setAmount(i.target.value)
            setETH_Value_Wei_String(toWei_String(i.target.value, ETHToken.decimals))
          }}
          onUseMax={(i)=>{//they want to use the maximum
            setAmount(maxValue) //so the input value updates for the user
            setETH_Value_Wei_String(ETHToken.balance.toString())
          }}
          allowUseAll={true}
          unit={ETHToken.symbol}
          maxValue={maxValue}
          variant="standard"
          newStyle
        />

        {(Number(LPRatio) < 0.10 && Number(value) > Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The ETH pool's balance and balance/liquidity ratio are low.
            Please use the classic bridge.
          </Typography>
        )}

        {(Number(LPRatio) < 0.10 && Number(value) <= Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The ETH pool's balance/liquidity ratio (of {Number(LPRatio).toFixed(2)}) is too low.
            Please use the classic bridge.
          </Typography>
        )}

        {(Number(LPRatio) >= 0.10 && Number(value) > Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The ETH pool's balance (of {Number(balanceSubPending).toFixed(2)} including inflight bridges) is too low.
            Please use the classic bridge or reduce the amount.
          </Typography>
        )}

    </>
  )
}

export default React.memo(InputStepFast)
