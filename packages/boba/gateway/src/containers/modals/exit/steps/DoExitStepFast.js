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

import { depositL2LP } from 'actions/networkAction'
import { openAlert } from 'actions/uiAction'

import { selectLoading } from 'selectors/loadingSelector'
import { selectSignatureStatus_exitLP } from 'selectors/signatureSelector'
import { selectLookupPrice } from 'selectors/lookupSelector'

import Button from 'components/button/Button'
import Input from 'components/input/Input'
import BridgeFee from 'components/bridgeFee/BridgeFee'

import { amountToUsd, logAmount, toWei_String } from 'util/amountConvert'

import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@emotion/react'
import { WrapperActionsModal } from 'components/modal/Modal.styles'

import BN from 'bignumber.js'

import {
  fetchFastExitCost,
  fetchL1LPBalance,
  fetchL1LPPending,
  fetchL1TotalFeeRate,
  fetchL1FeeRateN,
  fetchL2BalanceBOBA,
  fetchL2BalanceETH,
  fetchL1LPLiquidity,
  fetchExitFee,
} from 'actions/balanceAction'

import {
  selectL1FeeRateN,
  selectFastExitCost, //estimated total cost of this exit
  selectL1LPBalanceString,
  selectL1LPPendingString,
  selectL2BalanceBOBA,
  selectL2BalanceETH,
  selectL1LPLiquidity,
  selectExitFee,
} from 'selectors/balanceSelector'

import {
   selectBobaFeeChoice,
   selectBobaPriceRatio,
} from 'selectors/setupSelector'

function DoExitStepFast({ handleClose, token, isBridge, openTokenPicker }) {
  console.log([`DO EXIT STEP FAST`, token])

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')
  const [ max_Float, setMax_Float ] = useState(0.0) // support for Use Max - a number like 0.09 ETH

  const [ errorString, setErrorString ] = useState('')

  const [ feeETH, setFeeETH ] = useState(0.0)
  const [ feeBOBA, setFeeBOBA ] = useState(0.0)

  const [ LPRatio, setLPRatio ] = useState(0)

  const LPBalance = useSelector(selectL1LPBalanceString)
  const LPPending = useSelector(selectL1LPPendingString)
  const LPLiquidity = useSelector(selectL1LPLiquidity)

  const feeRateN = useSelector(selectL1FeeRateN)

  const cost = useSelector(selectFastExitCost)

  const feeBalanceETH = useSelector(selectL2BalanceETH)
  const feeBalanceBOBA = useSelector(selectL2BalanceBOBA)

  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())

  const [ validValue, setValidValue ] = useState(false)

  const loading = useSelector(selectLoading(['EXIT/CREATE']))

  const lookupPrice = useSelector(selectLookupPrice)
  const signatureStatus = useSelector(selectSignatureStatus_exitLP)

  const lpUnits = logAmount(LPBalance, token.decimals)
  const balanceSubPending = lpUnits - logAmount(LPPending, token.decimals) //subtract the in flight exits

  const exitFee = useSelector(selectExitFee)

  function setAmount(value) {

    const balance = Number(logAmount(token.balance, token.decimals))

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(max_Float))

    setErrorString('')

    if (value <= 0) {
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (tooSmall) {
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (tooBig) {
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      exitFee > Number(feeBalanceBOBA)) {
      setErrorString(`Insufficient BOBA balance to cover xChain message relay. You need at least ${exitFee} BOBA`)
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      token.symbol === 'ETH' &&
      (Number(value) + feeETH) > balance) {
      if(feeUseBoba)
        setErrorString('Warning: ETH amount + fees > balance. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet')
      else
        setErrorString('Warning: ETH amount + fees > balance')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      //pay BOBA, exit BOBA - check BOBA amount
      feeUseBoba &&
      token.symbol === 'BOBA' &&
      (Number(value) + feeBOBA + exitFee) > balance)
    {
      // insufficient BOBA to cover the BOBA amount plus gas plus exitFee
      setErrorString('Warning: BOBA amount + fees > balance')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      // insufficient ETH to cover exit fees
      // it does not matter if you are paying in ETH or BOBA
      feeETH > Number(feeBalanceETH))
    {
      // insufficient ETH to cover exit fees
      if(feeUseBoba)
        setErrorString('Warning: ETH balance too low. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet')
      else
        setErrorString('Warning: ETH balance too low to cover gas')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      // insufficient BOBA to cover exit fees
      feeUseBoba &&
      (feeBOBA + exitFee) > Number(feeBalanceBOBA))
    {
      setErrorString('Warning: BOBA balance too low to cover gas/fees')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (Number(LPRatio) < 0.1) {
      // not enough balance/liquidity ratio
      // we always want some balance for unstaking
      setErrorString('Warning: Insufficient balance in pool - reduce amount or use classical exit')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (Number(value) > Number(balanceSubPending) * 0.9) {
      //not enough absolute balance
      //we don't want one large bridge to wipe out all the balance
      //NOTE - this logic still allows bridgers to drain the entire pool, but just more slowly than before
      //this is because the every time someone exits, the limit is recalculated
      //via Number(LPBalance) * 0.9, and LPBalance changes over time
      setErrorString('Warning: Insufficient balance in pool - reduce amount or use classical exit')
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
    return (Number(value) * ((100 - Number(feeRateN)) / 100)).toFixed(3)
  }

  async function doExit() {

    let res = await dispatch(
      depositL2LP(
        token.address,
        value_Wei_String
      )
    )

    if (res) {
      dispatch(
          openAlert(
            `${token.symbol} was bridged to L1. You will receive approximately
            ${receivableAmount(value)} ${token.symbol} on L1.`
          )
        )
      handleClose()
    }

  }

  useEffect(() => {
    if (typeof(token) !== 'undefined') {
      dispatch(fetchL1LPBalance(token.addressL1))
      dispatch(fetchL1LPLiquidity(token.addressL1))
      dispatch(fetchL1LPPending(token.addressL2)) //lookup is, confusingly, via L2 token address
      dispatch(fetchL1TotalFeeRate())
      dispatch(fetchL1FeeRateN(token.addressL1))
      dispatch(fetchFastExitCost(token.address))
      dispatch(fetchL2BalanceETH())
      dispatch(fetchL2BalanceBOBA())
      dispatch(fetchExitFee())
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

  useEffect(() => {
    function estimateMax() {

      const safeCost = Number(cost) * 1.04 // 1.04 = safety margin on the cost

      setFeeETH(safeCost)
      setFeeBOBA(safeCost * feePriceRatio)

      const balance = Number(logAmount(token.balance, token.decimals))

      // because of MetaMask issue always have to limit ETH
      if(token.symbol === 'ETH') {
        if(balance - safeCost > 0.0)
          setMax_Float(balance - safeCost)
        else
          setMax_Float(0.0)
      }
      else if (token.symbol === 'BOBA' && feeUseBoba) {
        if(balance - (safeCost * feePriceRatio) - exitFee > 0.0)
          setMax_Float(balance - (safeCost * feePriceRatio) - exitFee)
        else
          setMax_Float(0.0)
      }
      else if (token.symbol === 'BOBA' && !feeUseBoba) {
        if(balance - exitFee > 0.0)
          setMax_Float(balance - exitFee)
        else
          setMax_Float(0.0)
      }
      else {
        setMax_Float(balance)
      }
    }
    if (Number(cost) > 0) estimateMax()
  }, [ token, cost, feeUseBoba, feePriceRatio, exitFee ])

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  let buttonLabel = 'Cancel'
  if( loading ) buttonLabel = 'Close'

  let estGas = ''
  if(feeETH && Number(feeETH) > 0) {
    if(feeUseBoba) {
      estGas = `${Number(feeBOBA).toFixed(4)} BOBA`
    } else {
      estGas = `${Number(feeETH).toFixed(4)} ETH`
    }
  }

  // prohibit ExitAll when paying with the token that is to be exited
  let allowUseAll = true
  if(token.symbol === 'ETH') {
    allowUseAll = false
  }
  else if (token.symbol === 'BOBA' && feeUseBoba) {
    allowUseAll = false
  }

  let receiveL1 = `${receivableAmount(value)} ${token.symbol}
              ${!!amountToUsd(value, lookupPrice, token) ? `($${amountToUsd(value, lookupPrice, token).toFixed(2)})`: ''}`

  if( Number(logAmount(token.balance, token.decimals)) === 0) {
    //no token in this account
    return (
      <Box>
        <Typography variant="body2" sx={{fontWeight: 700, mb: 1, color: 'yellow'}}>
          Sorry, nothing to exit - no {token.symbol} in this wallet
        </Typography>
        <Button
          onClick={handleClose}
          disabled={false}
          variant='outlined'
          color='primary'
          size='large'
        >
          Cancel
        </Button>
      </Box>)
  } else if ( exitFee > Number(feeBalanceBOBA) ) {
    //no token in this account
    return (
      <Box>
        <Typography variant="body2" sx={{fontWeight: 700, mb: 1, color: 'yellow'}}>
          <br/>
          BOBA balance: {Number(feeBalanceBOBA)}
          <br/>
          Insufficient BOBA balance to cover xChain message relay. You need at least {exitFee} BOBA.
        </Typography>
        <Button
          onClick={handleClose}
          disabled={false}
          variant='outlined'
          color='primary'
          size='large'
        >
          Cancel
        </Button>
      </Box>)
  }

  return (
    <>
      <Box>
        {!isBridge &&
          <Typography variant="h2" sx={{fontWeight: 700, mb: 1}}>
            Fast Bridge to L1
          </Typography>
        }

        {max_Float > 0.0 &&
          <Input
            label={`Amount to bridge to L1`}
            placeholder="0"
            value={value}
            type="number"
            onChange={(i)=>{
              setAmount(i.target.value)
              setValue_Wei_String(toWei_String(i.target.value, token.decimals))
            }}
            onUseMax={(i)=>{                                // they want to use the maximum
              setAmount(max_Float)                          // so the display value updates for the user
              setValue_Wei_String(token.balance.toString()) // this is ok because BridgeAll is blocked for both ETH and BOBA
            }}
            allowUseAll={allowUseAll}
            unit={token.symbol}
            maxValue={max_Float}
            variant="standard"
            newStyle
            loading={loading}
            isBridge={isBridge}
            openTokenPicker={openTokenPicker}
          />
        }

        {max_Float === 0 &&
          <Typography variant="body1" sx={{mt: 2}}>
            Loading...
          </Typography>
        }

        <BridgeFee
          lpFee={`${feeRateN}%`}
          estFee={estGas}
          exitFee={`${exitFee} BOBA`}
          estReceive={receiveL1}
          time="15 minutes to 3 hours"
        />

        {errorString !== '' &&
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            {errorString}
          </Typography>
        }

        {(Number(LPRatio) < 0.10 && Number(value) > Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The pool's balance and balance/liquidity ratio are too low.
            Please use the classic bridge.
          </Typography>
        )}

        {(Number(LPRatio) < 0.10 && Number(value) <= Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The pool's balance/liquidity ratio (of {Number(LPRatio).toFixed(2)}) is too low.
            Please use the classic bridge.
          </Typography>
        )}

        {(Number(LPRatio) >= 0.10 && Number(value) > Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The pool's balance (of {Number(balanceSubPending).toFixed(2)} including inflight bridges) is too low.
            Please use the classic bridge or reduce the amount.
          </Typography>
        )}

        {!isBridge && loading && (
          <Typography variant="body2" sx={{mt: 2}}>
            This window will automatically close when your transaction has been signed and submitted.
          </Typography>
        )}
      </Box>

      <WrapperActionsModal>
        <Button
          onClick={handleClose}
          disabled={false}
          variant='outlined'
          color='primary'
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
