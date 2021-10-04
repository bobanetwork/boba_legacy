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

import { amountToUsd, logAmount, toWei_String } from 'util/amountConvert'
import networkService from 'services/networkService'

import { Typography, useMediaQuery } from '@material-ui/core'
import { useTheme } from '@emotion/react'
import { WrapperActionsModal } from 'components/modal/Modal.styles'
import { Box } from '@material-ui/system'

import BN from 'bignumber.js'

function DoExitStepFast({ handleClose, token }) {

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')  //support for Use Max

  const [LPBalance, setLPBalance] = useState(0)
  const [feeRate, setFeeRate] = useState(0)
  const [validValue, setValidValue] = useState(false)

  const loading = useSelector(selectLoading(['EXIT/CREATE']))

  const lookupPrice = useSelector(selectLookupPrice)
  const signatureStatus = useSelector(selectSignatureStatus_exitLP)

  const maxValue = logAmount(token.balance, token.decimals)

  function setAmount(value) {

    //console.log("setAmount")

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(maxValue))

    //console.log("tooSmall",tooSmall)
    //console.log("tooBig",tooBig)

    if (tooSmall || tooBig) {
      setValidValue(false)
    } else {
      setValidValue(true)
    }

    setValue(value)
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

  useEffect(() => {
    if (typeof(token) !== 'undefined') {
      networkService.L1LPBalance(token.addressL1).then((res) => {
        setLPBalance(Number(logAmount(res, token.decimals)).toFixed(3))
      })
      networkService.getTotalFeeRate().then((feeRate) => {
        setFeeRate(feeRate)
      })
    }
    // to clean up state and fix the
    // error in console for max state update.
    return ()=>{
      setLPBalance(0)
      setFeeRate(0)
    }
  }, [ token ])

  useEffect(() => {
    if (signatureStatus && loading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      handleClose()
    }
  }, [ signatureStatus, loading, handleClose ])

  const feeLabel = 'There is a ' + feeRate + '% fee.'

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  let buttonLabel = 'Cancel'
  if( loading ) buttonLabel = 'Close'

  return (
    <>
      <Box>
        <Typography variant="h2" sx={{fontWeight: 700, mb: 1}}>
          Fast Bridge to L1
        </Typography>

        <Typography variant="body2" sx={{mb: 3}}>{feeLabel}</Typography>

        <Input
          label={`Amount to bridge to L1`}
          placeholder="0.0"
          value={value}
          type="number"
          onChange={(i)=>{
            setAmount(i.target.value)
            setValue_Wei_String(toWei_String(i.target.value, token.decimals))
          }}
          onUseMax={(i)=>{//they want to use the maximum
            setAmount(maxValue) //so the input value updates for the user
            setValue_Wei_String(token.balance.toString())
          }}
          allowUseAll={true}
          unit={token.symbol}
          maxValue={maxValue}
          newStyle
          variant="standard"
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

        {Number(LPBalance) < Number(value) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The liquidity pool balance (of {LPBalance}) is too low to cover your bridge - please
            use the classic bridge or reduce the amount.
          </Typography>
        )}

        {loading && (
          <Typography variant="body2" sx={{mt: 2, color: 'green'}}>
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
