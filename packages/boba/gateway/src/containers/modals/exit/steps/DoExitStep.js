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

import { useTheme } from '@emotion/react'

import { Box, Typography, useMediaQuery } from '@mui/material'

import { exitBOBA } from 'actions/networkAction'
import { openAlert } from 'actions/uiAction'

import Button from 'components/button/Button'
import Input from 'components/input/Input'

import { selectLoading } from 'selectors/loadingSelector'
import { selectSignatureStatus_exitTRAD } from 'selectors/signatureSelector'
import { selectLookupPrice } from 'selectors/lookupSelector'

import {
   selectBobaFeeChoice,
   selectBobaPriceRatio,
} from 'selectors/setupSelector'

import { amountToUsd, logAmount, toWei_String } from 'util/amountConvert'

import { WrapperActionsModal } from 'components/modal/Modal.styles'

import parse from 'html-react-parser'

import BN from 'bignumber.js'

import { 
  fetchClassicExitCost,
  fetchL2BalanceETH, 
  fetchL2BalanceBOBA, 
} from 'actions/balanceAction'

import { 
  selectClassicExitCost, //estimated total cost of this exit
  selectL2BalanceETH,
  selectL2BalanceBOBA,
} from 'selectors/balanceSelector'

function DoExitStep({ handleClose, token }) {

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')  // support for Use Max - amount to transfer in wei_string
  const [ max_Float, setMax_Float ] = useState(0.0)                // support for Use Max - a number like 0.09 ETH

  const [ errorString, setErrorString ] = useState('')

  const [ feeETH, setFeeETH ] = useState(0.0)
  const [ feeBOBA, setFeeBOBA ] = useState(0.0)

  const [ validValue, setValidValue ] = useState(false)
  const loading = useSelector(selectLoading(['EXIT/CREATE']))

  const signatureStatus = useSelector(selectSignatureStatus_exitTRAD)
  const lookupPrice = useSelector(selectLookupPrice)

  const cost = useSelector(selectClassicExitCost)

  const feeBalanceETH = useSelector(selectL2BalanceETH)
  const feeBalanceBOBA = useSelector(selectL2BalanceBOBA)

  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())

  function setAmount(value) {

    const balance = Number(logAmount(token.balance, token.decimals))

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(max_Float))
  
    setErrorString('')

    if (tooSmall || tooBig) {
      setErrorString('Warning: Value out of bounds')
      setValidValue(false)
      setValue(value)
      return false
    } 
    else if (
      !feeUseBoba && // check is needed regardless of fee token choice
      token.symbol === 'ETH' && 
      (Number(value) + feeETH) > balance) 
    {
      // insufficient ETH to cover the ETH amount plus gas
      // due to MetaMask issue, this is needed even if you are paying in ETH
      setErrorString('Warning: ETH amount + fees > balance')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      feeUseBoba && // check is needed regardless of fee token choice
      token.symbol === 'ETH' && 
      (Number(value) + feeETH) > balance) 
    {
      // insufficient ETH to cover the ETH amount plus gas
      // due to MetaMask issue, this is needed even if you are paying in ETH
      setErrorString('Warning: ETH balance too low. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet.')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      feeUseBoba &&
      token.symbol === 'BOBA' && 
      (Number(value) + feeBOBA) > balance) 
    {
      // insufficient BOBA to cover the BOBA amount plus gas
      setErrorString('Warning: BOBA amount + fees > balance')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      !feeUseBoba &&
      feeETH > Number(feeBalanceETH)) 
    {
      // insufficient ETH to cover exit fees
      setErrorString('Warning: ETH balance too low.')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      feeUseBoba &&
      feeETH > Number(feeBalanceETH)) 
    {
      // insufficient ETH to cover exit fees
      setErrorString('Warning: ETH balance too low. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet.')
      setValidValue(false)
      setValue(value)
      return false
    }
    else if (
      feeUseBoba &&
      feeBOBA > Number(feeBalanceBOBA)) 
    {
      // insufficient BOBA to cover exit fees
      setErrorString('Warning: BOBA balance too low')
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

  async function doExit() {

    console.log("Amount to exit:", value_Wei_String)

    let res = await dispatch(exitBOBA(token.address, value_Wei_String))

    if (res) {
      dispatch(
        openAlert(
          `${token.symbol} was bridged to L1. You will receive
          ${Number(value).toFixed(3)} ${token.symbol}
          on L1 in 7 days.`
        )
      )
      handleClose()
    }
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  let buttonLabel = 'Cancel'
  if( loading ) buttonLabel = 'Close'

  useEffect(() => {
    if (signatureStatus && loading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      handleClose()
    }
  }, [ signatureStatus, loading, handleClose ])

  useEffect(() => {
    if (typeof(token) !== 'undefined') {
      console.log("Token:",token)
      dispatch(fetchClassicExitCost(token.address))
      dispatch(fetchL2BalanceETH())
      dispatch(fetchL2BalanceBOBA())
    }
  }, [ token, dispatch ])

  useEffect(() => {

    function estimateMax() {
      
      const safeCost = Number(cost) * 1.04 // 1.04 = safety margin on the cost
      console.log("ETH fees:", safeCost)
      console.log("BOBA fees:", safeCost * feePriceRatio)

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
        if(balance - safeCost > 0.0)
          setMax_Float(balance - safeCost)
        else
          setMax_Float(0.0)
      } 
      else {
        setMax_Float(balance)
      }
    }
    if (Number(cost) > 0) estimateMax()
  }, [ token, cost, feeUseBoba, feePriceRatio ])

  let ETHstring = ''

  if(feeETH && Number(feeETH) > 0) {
    if(feeUseBoba) {
      ETHstring = `Estimated gas (approval + exit): ${Number(feeBOBA).toFixed(4)} BOBA` 
    } else {
      ETHstring = `Estimated gas (approval + exit): ${Number(feeETH).toFixed(4)} ETH` 
    }
  }

  // prohibit ExitAll when paying with the token that is to be exited 
  let allowExitall = true
  if(token.symbol === 'ETH') {
    allowExitall = false
  } 
  else if (token.symbol === 'BOBA' && feeUseBoba) {
    allowExitall = false
  }

  return (
    <>
      <Box>
        <Typography variant="h2" sx={{fontWeight: 700, mb: 3}}>
          Classic Bridge to L1 ({`${token ? token.symbol : ''}`})
        </Typography>

        {max_Float > 0.0 &&
          <Input
            label={'Amount to bridge to L1'}
            placeholder="0"
            value={value}
            type="number"
            onChange={(i)=>{
              setAmount(i.target.value)
              setValue_Wei_String(toWei_String(i.target.value, token.decimals))
            }}
            onUseMax={(i)=>{//they want to use the maximum
              setAmount(max_Float) //so the display value updates for the user
              setValue_Wei_String(token.balance.toString())
            }}
            allowUseAll={allowExitall}
            unit={token.symbol}
            maxValue={max_Float}
            variant="standard"
            newStyle
          />
        }
        {max_Float === 0 &&
          <Typography variant="body1" sx={{mt: 2}}>
            Loading...
          </Typography>
        }
        {validValue && token && (
          <Typography variant="body2" sx={{mt: 2}}>
            {value &&
              `You will receive ${Number(value).toFixed(3)} ${token.symbol}
              ${!!amountToUsd(value, lookupPrice, token) ? `($${amountToUsd(value, lookupPrice, token).toFixed(2)})`: ''}
              on L1. Your funds will be available on L1 in 7 days.`}
          </Typography>
        )}
        
        <Typography variant="body2" sx={{mt: 2}}>
          {parse(ETHstring)}
        </Typography>
        
        {errorString !== '' &&
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            {errorString}
          </Typography>
        }

        {loading && (
          <Typography variant="body2" sx={{mt: 2, color: 'green'}}>
            This window will close when your transaction has been signed and submitted.
          </Typography>
        )}
      </Box>

      <WrapperActionsModal>
          <Button
            onClick={handleClose}
            color="neutral"
            size="large"
          >
            {buttonLabel}
          </Button>
          {token && (
            <Button
              onClick={doExit}
              color="primary"
              variant="contained"
              loading={loading}
              tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to bridge your funds to L1"}
              disabled={!validValue}
              triggerTime={new Date()}
              fullWidth={isMobile}
              size="large"
            >
              Bridge to L1
            </Button>
          )}
      </WrapperActionsModal>
    </>
  )
}

export default React.memo(DoExitStep)
