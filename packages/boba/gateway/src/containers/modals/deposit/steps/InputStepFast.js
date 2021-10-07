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

import { useTheme } from '@emotion/react'

import { Typography, useMediaQuery } from '@material-ui/core'
import { Box } from '@material-ui/system'
import { depositL1LP, approveERC20 } from 'actions/networkAction'

import { openAlert, openError, setActiveHistoryTab1 } from 'actions/uiAction'

import Button from 'components/button/Button'
import Input from 'components/input/Input'

import { WrapperActionsModal } from 'components/modal/Modal.styles'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { selectLoading } from 'selectors/loadingSelector'
import { selectLookupPrice } from 'selectors/lookupSelector'
import { selectSignatureStatus_depositLP } from 'selectors/signatureSelector'

import networkService from 'services/networkService'
import { logAmount, amountToUsd, toWei_String } from 'util/amountConvert'

import BN from 'bignumber.js'

function InputStepFast({ handleClose, token }) {

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')  //support for Use Max

  const [LPBalance, setLPBalance] = useState(0)
  const [feeRate, setFeeRate] = useState(0)
  const [ validValue, setValidValue ] = useState(false)

  const depositLoading = useSelector(selectLoading(['DEPOSIT/CREATE']))
  const approvalLoading = useSelector(selectLoading(['APPROVE/CREATE']))

  const lookupPrice = useSelector(selectLookupPrice)
  const signatureStatus = useSelector(selectSignatureStatus_depositLP)

  const maxValue = logAmount(token.balance, token.decimals)

  function setAmount(value) {

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(maxValue))

    if (tooSmall || tooBig) {
      setValidValue(false)
    } else {
      setValidValue(true)
    }

    setValue(value)
  }

  async function doDeposit() {

    let res

    console.log("Amount to bridge to L2:", value_Wei_String)

    if(token.symbol === 'ETH') {

      console.log("ETH Fast Bridge")

      res = await dispatch(depositL1LP(token.address, value_Wei_String))

      if (res) {
        dispatch(setActiveHistoryTab1('Bridge to L2'))
        dispatch(
          openAlert(
            `ETH was bridged. You will receive
            ${((Number(value) * (100 - Number(feeRate)))/100).toFixed(3)}
            ETH on L2`
          )
        )
        handleClose()
        return
      }

    }

    //at this point we know it's not ETH
    console.log("ERC20 Fast Bridge")

    res = await dispatch(
      approveERC20(
        value_Wei_String,
        token.address,
        networkService.L1LPAddress
      )
    )

    if(!res) {
      dispatch(openError('Failed to approve amount'))
    }

    res = await dispatch(
      depositL1LP(token.address, value_Wei_String)
    )

    if (res) {
      dispatch(setActiveHistoryTab1('Bridge to L2'))
      dispatch(
        openAlert(
          `${token.symbol} was bridged to the L1LP. You will receive
           ${receivableAmount(value)} ${token.symbol} on L2`
        )
      )
      handleClose()
    }

  }

  const receivableAmount = (value) => {
    return (Number(value) * ((100 - Number(feeRate)) / 100)).toFixed(3)
  }

  useEffect(() => {
    if (typeof(token) !== 'undefined') {
      networkService.L2LPBalance(token.addressL2).then((res) => {
        setLPBalance(Number(logAmount(res, token.decimals)).toFixed(3))
      })
      networkService.getTotalFeeRate().then((feeRate) => {
        setFeeRate(feeRate)
      })
    }
  }, [token])

  useEffect(() => {
    if (signatureStatus && depositLoading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      handleClose()
    }
  }, [ signatureStatus, depositLoading, handleClose ])

  const label = 'There is a ' + feeRate + '% fee.'

  let buttonLabel_1 = 'Cancel'
  if( depositLoading || approvalLoading ) buttonLabel_1 = 'CLOSE WINDOW'

  let buttonLabel_2 = 'Bridge'

  if(depositLoading) {
    buttonLabel_2 = "Bridging..."
  } else if (approvalLoading) {
    buttonLabel_2 = "Approving..."
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <>
      <Box>
        <Typography variant="h2" sx={{fontWeight: 700, mb: 1}}>
          Fast Bridge
        </Typography>

        <Typography variant="body2" sx={{mb: 3}}>{label}</Typography>

        <Input
          label={`Amount to bridge`}
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
          variant="standard"
          newStyle
        />

        {validValue && token && (
          <Typography variant="body2" sx={{mt: 2}}>
            {`You will receive ${receivableAmount(value)} ${token.symbol} ${!!amountToUsd(value, lookupPrice, token) ?  `($${amountToUsd(value, lookupPrice, token).toFixed(2)})`: ''} on L2.`}
          </Typography>
        )}

        {!!token && token.symbol === 'OMG' && (
          <Typography variant="body2" sx={{mt: 2}}>
            NOTE: The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
            In some cases, three interactions with MetaMask are needed. If you are bridging out of a
            new wallet, it starts out with a 0 approval, and therefore, only two interactions with
            MetaMask will be needed.
          </Typography>
        )}

        {Number(value) > Number(LPBalance) && (
          <Typography variant="body2" sx={{ color: 'red', my: 2}}>
            The liquidity pool balance (of {LPBalance}) is too low to cover your fast bridge. Please
            use the traditional bridge or reduce the amount.
          </Typography>
        )}

        {(depositLoading || approvalLoading) && (
          <Typography variant="body2" sx={{mt: 2, color: 'green'}}>
            This window will automatically close when your transaction has been signed and submitted.
          </Typography>
        )}
      </Box>

      <WrapperActionsModal>
        <Button
          onClick={handleClose}
          color="neutral"
          size="large"
        >
          {buttonLabel_1}
        </Button>
        <Button
          onClick={doDeposit}
          color='primary'
          variant="contained"
          loading={depositLoading || approvalLoading}
          tooltip={depositLoading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to bridge your funds to L2"}
          disabled={!validValue}
          triggerTime={new Date()}
          size="large"
          fullWidth={isMobile}
          newStyle
        >
          {buttonLabel_2}
        </Button>
      </WrapperActionsModal>
    </>
  )
}

export default React.memo(InputStepFast)
