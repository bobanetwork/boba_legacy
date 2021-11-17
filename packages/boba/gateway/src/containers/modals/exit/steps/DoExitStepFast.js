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

import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { depositL2LP, fastExitAll } from 'actions/networkAction'
import { openAlert, openError } from 'actions/uiAction'

import { selectLoading } from 'selectors/loadingSelector'
import { selectSignatureStatus_exitLP } from 'selectors/signatureSelector'
import { selectLookupPrice } from 'selectors/lookupSelector'

import Button from 'components/button/Button'
import Input from 'components/input/Input'

import { amountToUsd, logAmount, toWei_String } from 'util/amountConvert'

import { Typography, useMediaQuery } from '@material-ui/core'
import { useTheme } from '@emotion/react'
import { WrapperActionsModal } from 'components/modal/Modal.styles'
import { Box } from '@material-ui/system'

import parse from 'html-react-parser'

import BN from 'bignumber.js'

import { 
  fetchFastExitCost, 
  fetchL1LPBalance,
  fetchL1LPPending,  
  fetchL1TotalFeeRate, 
  fetchL2FeeBalance,
  fetchL1LPLiquidity 
} from 'actions/balanceAction'

import { 
  selectL1FeeRate, 
  selectFastExitCost, //estimated total cost of this exit
  selectL1LPBalanceString, 
  selectL1LPPendingString,
  selectL2FeeBalance, 
  selectL1LPLiquidity 
} from 'selectors/balanceSelector'

function DoExitStepFast({ handleClose, token }) {

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')

  const [ LPRatio, setLPRatio ] = useState(0)

  const LPBalance = useSelector(selectL1LPBalanceString)
  const LPPending = useSelector(selectL1LPPendingString)
  const LPLiquidity = useSelector(selectL1LPLiquidity)
  const feeRate = useSelector(selectL1FeeRate)
  const cost = useSelector(selectFastExitCost)
  const feeBalance = useSelector(selectL2FeeBalance)

  const [ validValue, setValidValue ] = useState(false)

  const loading = useSelector(selectLoading(['EXIT/CREATE']))

  const lookupPrice = useSelector(selectLookupPrice)
  const signatureStatus = useSelector(selectSignatureStatus_exitLP)

  const maxValue = logAmount(token.balance, token.decimals)
  const lpUnits = logAmount(LPBalance, token.decimals)
  const balanceSubPending = lpUnits - logAmount(LPPending, token.decimals) //subtract the in flight exits

  function setAmount(value) {

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(maxValue))

    console.log("ETH fees:",Number(cost))
    console.log("Transaction token value:",Number(value))
    console.log("ETH available for fees:",Number(feeBalance))
    console.log("LPRatio:",Number(LPRatio))
    console.log("LPBalance:",Number(balanceSubPending))

    if (tooSmall || tooBig) {
      setValidValue(false)
      setValue(value)
      return false
    } else if (token.symbol === 'ETH' && (Number(cost) + Number(value)) > Number(feeBalance)) {
      //insufficient ETH to cover the ETH amount plus gas
      setValidValue(false)
      setValue(value)
      return false
    } else if ((Number(cost) > Number(feeBalance))) {
      //insufficient ETH to pay exit fees
      setValidValue(false)
      setValue(value)
      return false
    } else if (Number(LPRatio) < 0.1) {
      //not enough balance/liquidity ratio
      //we always want some balance for unstaking
      setValidValue(false)
      setValue(value)
      return false
    } else if (Number(value) > Number(balanceSubPending) * 0.9) {
      //not enough absolute balance
      //we don't want one large bridge to wipe out all the balance
      //NOTE - this logic still allows bridgers to drain the entire pool, but just more slowly than before
      //this is because the every time someone exits, the limit is recalculated
      //via Number(LPBalance) * 0.9, and LPBalance changes over time 
      setValidValue(false)
      setValue(value)
      return false
    } else {
      //Whew, finally!
      setValidValue(true)
      setValue(value)
      return true
    }

  }

  const receivableAmount = (value) => {
    return (Number(value) * ((100 - Number(feeRate)) / 100)).toFixed(3)
  }

  async function doExit() {

    console.log("Amount to exit:", value_Wei_String)

    let res = await dispatch(
      depositL2LP(
        token.address,
        value_Wei_String
      )
    )

    if (res) {
      dispatch(
          openAlert(
            `${token.symbol} was bridged. You will receive
            ${receivableAmount(value)} ${token.symbol} on L1.`
          )
        )
      handleClose()
    }

  }

  async function doExitAll() {

    console.log("Amount to exit:", token.balance.toString())

    const value = logAmount(token.balance, token.decimals)
    const valid = setAmount(value)

    if(valid) {
      let res = await dispatch(
        fastExitAll(
          token.address
        )
      )
      if (res) {
        dispatch(
            openAlert(
              `${token.symbol} was bridged. You will receive
              ${receivableAmount(value)} ${token.symbol} 
              minus gas fees (if bridging ETH) on L1.`
            )
          )
        handleClose()
      }
    } else {
      dispatch(
        openError(
          `You cannot currently fast bridge all of your ${token.symbol} due to insufficient liquidity ratio (of ${Number(LPRatio).toFixed(2)})
          and/or insufficient pool balance (of ${Number(balanceSubPending).toFixed(2)}). Please reduce the amount you wish to exit 
          to below ${Number(balanceSubPending).toFixed(2)*0.9} or use the classic bridge instead.`
        )
      )
    }

  }

  useEffect(() => {
    if (typeof(token) !== 'undefined') {
      console.log("Token:",token)
      dispatch(fetchL1LPBalance(token.addressL1))
      dispatch(fetchL1LPLiquidity(token.addressL1))
      dispatch(fetchL1LPPending(token.addressL2)) //lookup is, confusingly, via L2 token address
      dispatch(fetchL1TotalFeeRate())
      dispatch(fetchFastExitCost(token.address))
      dispatch(fetchL2FeeBalance())
    }
    // to clean up state and fix the
    // error in console for max state update.
    return ()=>{
      dispatch({type: 'BALANCE/L1/RESET'})
    }
  }, [ token, dispatch ])

  useEffect(() => {
    const lbl = Number(logAmount(LPLiquidity, token.decimals))
    if(lbl > 0){
      const lbp = Number(logAmount(LPBalance, token.decimals))
      const LPR = lbp / lbl
      setLPRatio(Number(LPR).toFixed(3))
    }
  }, [ LPLiquidity, LPBalance, token.decimals ])

  useEffect(() => {
    if (signatureStatus && loading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      handleClose()
    }
  }, [ signatureStatus, loading, handleClose ])

  const feeLabel = 'There is a ' + feeRate + '% fee'

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  let buttonLabel = 'Cancel'
  if( loading ) buttonLabel = 'Close'

  let ETHstring = ''
  let warning = false

  if(cost && Number(cost) > 0) {
    
    if (token.symbol !== 'ETH') {
      if(Number(cost) > Number(feeBalance)) {
        warning = true
        ETHstring = `Estimated gas (approval + bridge): ${Number(cost).toFixed(4)} ETH 
        <br/>WARNING: your L2 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover gas. 
        <br/>TRANSACTION WILL FAIL.` 
      } 
      else if(Number(cost) > Number(feeBalance) * 0.96) {
        warning = true
        ETHstring = `Estimated gas (approval + bridge): ${Number(cost).toFixed(4)} ETH 
        <br/>CAUTION: your L2 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated cost. 
        <br/>TRANSACTION MIGHT FAIL. It would be safer to have slightly more ETH in your L2 wallet to cover gas.` 
      } 
      else {
        ETHstring = `Estimated gas (approval + bridge): ${Number(cost).toFixed(4)} ETH` 
      }
    }

    if (token.symbol === 'ETH') {
      if((Number(value) + Number(cost)) > Number(feeBalance)) {
        warning = true
        ETHstring = `Transaction total (amount + approval + bridge): ${(Number(value) + Number(cost)).toFixed(4)} ETH 
        <br/>WARNING: your L2 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover this transaction. 
        <br/>TRANSACTION WILL FAIL. To bridge all your ETH, select "BRIDGE ALL".` 
      }
      else if ((Number(value) + Number(cost)) > Number(feeBalance) * 0.96) {
        warning = true
        ETHstring = `Transaction total (amount + approval + bridge): ${(Number(value) + Number(cost)).toFixed(4)} ETH 
        <br/>CAUTION: your L2 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated total. 
        <br/>TRANSACTION MIGHT FAIL. To bridge all your ETH, select "BRIDGE ALL".` 
      } else {
        ETHstring = `Transaction total (amount + approval + bridge): ${(Number(value) + Number(cost)).toFixed(4)} ETH` 
      }
    }
  }

  return (
    <>
      <Box>

        <Typography variant="h2" sx={{fontWeight: 700, mb: 1}}>
          Fast Bridge to L1
        </Typography>

        <Typography variant="body2" sx={{mb: 3}}>{feeLabel}</Typography>

        <Input
          label={`Amount to bridge to L1`}
          placeholder="0"
          value={value}
          type="number"
          onChange={(i)=>{
            setAmount(i.target.value)
            setValue_Wei_String(toWei_String(i.target.value, token.decimals))
          }}
          unit={token.symbol}
          maxValue={maxValue}
          newStyle
          variant="standard"
          loading={loading}
          onExitAll={doExitAll}
          allowExitAll={true}
        />

        {validValue && token && (
          <Typography variant="body2" sx={{mt: 2}}>
            {value &&
              `You will receive
              ${receivableAmount(value)}
              ${token.symbol}
              ${!!amountToUsd(value, lookupPrice, token) ?  `($${amountToUsd(value, lookupPrice, token).toFixed(2)})`: ''}
              on L1.`
            }
          </Typography>
        )}
        
        {warning && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            {parse(ETHstring)}
          </Typography>
        )}

        {!warning && (
          <Typography variant="body2" sx={{mt: 2}}>
            {parse(ETHstring)}
          </Typography>
        )}

        {(Number(LPRatio) < 0.10 || Number(value) > Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The pool's balance (of {Number(balanceSubPending).toFixed(2)} including inflight bridges) and/or balance/liquidity ratio (of {Number(LPRatio).toFixed(2)}) is low. 
            Please use the classic bridge or reduce the amount.
          </Typography>
        )}

        {loading && (
          <Typography variant="body2" sx={{mt: 2}}>
            This window will automatically close when your transaction has been signed and submitted.
          </Typography>
        )}
      </Box>

      <WrapperActionsModal>
        <Button
          onClick={handleClose}
          color='neutral'
          size='large'
        >
          {buttonLabel}
        </Button>
        <Button
          onClick={doExit}
          color='primary'
          variant='contained'
          loading={loading}
          tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to bridge your funds to L1"}
          disabled={!validValue}
          triggerTime={new Date()}
          fullWidth={isMobile}
          size='large'
        >
          Bridge to L1
        </Button>
      </WrapperActionsModal>
    </>
  )
}

export default React.memo(DoExitStepFast)
