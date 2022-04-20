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

import { Box, Typography, useMediaQuery } from '@mui/material'

import { depositL1LP, approveERC20 } from 'actions/networkAction'

import { openAlert, openError, setActiveHistoryTab } from 'actions/uiAction'

import Button from 'components/button/Button'
import Input from 'components/input/Input'

import { WrapperActionsModal } from 'components/modal/Modal.styles'
import BridgeFee from 'components/bridgeFee/BridgeFee'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { selectLoading } from 'selectors/loadingSelector'
import { selectLookupPrice } from 'selectors/lookupSelector'
import { selectSignatureStatus_depositLP } from 'selectors/signatureSelector'

import networkService from 'services/networkService'
import { logAmount, amountToUsd, toWei_String } from 'util/amountConvert'

import parse from 'html-react-parser'

import BN from 'bignumber.js'

import {
  fetchFastDepositCost,
  fetchL2LPBalance,
  fetchL2LPPending,
  fetchL2TotalFeeRate,
  fetchL2FeeRateN,
  fetchL1FeeBalance,
  fetchL2LPLiquidity,
 } from 'actions/balanceAction'

import {
  selectL2FeeRateN,
  selectFastDepositCost,
  selectL2LPBalanceString,
  selectL2LPPendingString,
  selectL1FeeBalance,
  selectL2LPLiquidity
} from 'selectors/balanceSelector'

function InputStepFast({ handleClose, token, isBridge, openTokenPicker }) {

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')  //support for Use Max

  const [ LPRatio, setLPRatio ] = useState(0)

  const LPBalance = useSelector(selectL2LPBalanceString)
  const LPPending = useSelector(selectL2LPPendingString)
  const LPLiquidity = useSelector(selectL2LPLiquidity)

  const feeRateN = useSelector(selectL2FeeRateN)

  const cost = useSelector(selectFastDepositCost)

  const feeBalance = useSelector(selectL1FeeBalance) //amount of ETH on L1 to pay gas

  const [ validValue, setValidValue ] = useState(false)

  const depositLoading = useSelector(selectLoading(['DEPOSIT/CREATE']))
  const approvalLoading = useSelector(selectLoading(['APPROVE/CREATE']))

  const lookupPrice = useSelector(selectLookupPrice)
  const signatureStatus = useSelector(selectSignatureStatus_depositLP)

  const allAddresses = networkService.getAllAddresses()

  const maxValue = logAmount(token.balance, token.decimals)
  const lpUnits = logAmount(LPBalance, token.decimals)
  const balanceSubPending = lpUnits - logAmount(LPPending, token.decimals) //subtract the in flight exits

  function setAmount(value) {

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(maxValue))

    // console.log("ETH fees:",Number(cost))
    // console.log("Transaction token value:",Number(value))
    // console.log("ETH available for paying fees:",Number(feeBalance))
    // console.log("LPRatio:",Number(LPRatio))
    // console.log("LPBalance:",Number(balanceSubPending))

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
      //insufficient ETH to pay gas
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
      //we don't want one large bridge to wipe out the entire balance
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
    return (Number(value) * ((100 - Number(feeRateN)) / 100)).toFixed(3)
  }

  async function doDeposit() {

    console.log(`${token.symbol} Amount to bridge to L2: ${value_Wei_String}`)

    let res

    if(token.symbol === 'ETH') {

      console.log("ETH Fast Bridge")

      res = await dispatch(depositL1LP(token.address, value_Wei_String))

      if (res) {
        dispatch(setActiveHistoryTab('Bridge to L2'))
        dispatch(
          openAlert(
            `ETH was bridged. You will receive approximately
            ${((Number(value) * (100 - Number(feeRateN)))/100).toFixed(3)}
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
        allAddresses.L1LPAddress
      )
    )

    if(res === false) {
      dispatch(openError('Failed to approve amount or user rejected signature'))
      handleClose()
      return
    }

    res = await dispatch(
      depositL1LP(token.address, value_Wei_String)
    )

    if (res) {
      dispatch(setActiveHistoryTab('Bridge to L2'))
      dispatch(
        openAlert(
          `${token.symbol} was bridged to the L1LP. You will receive approximately
           ${receivableAmount(value)} ${token.symbol} on L2`
        )
      )
      handleClose()
    }

  }

  //ok, we are on L1, but the funds will be paid out on l2
  //goal now is to find out as much as we can about the state of the l2 pools...
  useEffect(() => {
    if (typeof(token) !== 'undefined') {
      dispatch(fetchL2LPBalance(token.addressL2))
      dispatch(fetchL2LPLiquidity(token.addressL2))
      dispatch(fetchL2LPPending(token.addressL1)) //lookup is, confusingly, via L1 token address
      dispatch(fetchL2TotalFeeRate())
      dispatch(fetchL2FeeRateN(token.addressL2))
      dispatch(fetchFastDepositCost(token.address))
      dispatch(fetchL1FeeBalance()) //ETH balance for paying gas
      return ()=>{
        dispatch({type: 'BALANCE/L2/RESET'})
      }
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
    if (signatureStatus && depositLoading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      handleClose()
    }
  }, [ signatureStatus, depositLoading, handleClose ])

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

  let ETHstring = ''
  let warning = false

  if(cost && Number(cost) > 0) {

    if (token.symbol !== 'ETH') {
      if(Number(cost) > Number(feeBalance)) {
        warning = true
        ETHstring = `WARNING: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover the estimated gas.
        <br/>THIS TRANSACTION WILL FAIL.`
      }
      else if(Number(cost) > Number(feeBalance) * 0.96) {
        warning = true
        ETHstring = `CAUTION: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated cost.
        <br/>THIS TRANSACTION MIGHT FAIL. It would be safer to have slightly more ETH in your L1 wallet to cover gas.`
      }
    }

    if (token.symbol === 'ETH') {
      if((Number(value) + Number(cost)) > Number(feeBalance)) {
        warning = true
        ETHstring = `WARNING: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover this transaction.
        <br/>THIS TRANSACTION WILL FAIL.`
      }
      else if ((Number(value) + Number(cost)) > Number(feeBalance) * 0.96) {
        warning = true
        ETHstring = `CAUTION: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated total.
        <br/>THIS TRANSACTION MIGHT FAIL.`
      }
    }
  }

  if( Number(logAmount(token.balance, token.decimals)) === 0) {
    //no token in this account
    return (
      <Box>
        <Typography variant="body2" sx={{fontWeight: 700, mb: 1, color: 'yellow'}}>
          Sorry, nothing to deposit - no {token.symbol} in this wallet
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
            Fast Bridge to L2
          </Typography>
        }

        <Input
          label={`Amount to bridge`}
          placeholder="0"
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
          isBridge={isBridge}
          openTokenPicker={openTokenPicker}
        />

        <BridgeFee
          lpFee={`${feeRateN}%`}
          estReceive={`${receivableAmount(value)} ${token.symbol} ${!!amountToUsd(value, lookupPrice, token) ? `($${amountToUsd(value, lookupPrice, token).toFixed(2)})` : ''}`}
          time="20 mins - 3 hours"
          estFee={`${Number(cost).toFixed(4)} ETH`}
        />




        {(Number(LPRatio) < 0.10 && Number(value) > Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The {token.symbol} pool's balance and balance/liquidity ratio are low.
            Please use the classic bridge.
          </Typography>
        )}

        {(Number(LPRatio) < 0.10 && Number(value) <= Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The {token.symbol} pool's balance/liquidity ratio (of {Number(LPRatio).toFixed(2)}) is too low.
            Please use the classic bridge.
          </Typography>
        )}

        {(Number(LPRatio) >= 0.10 && Number(value) > Number(balanceSubPending) * 0.90) && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            The {token.symbol} pool's balance (of {Number(balanceSubPending).toFixed(2)} including inflight bridges) is too low.
            Please use the classic bridge or reduce the amount.
          </Typography>
        )}

        {warning && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            {parse(ETHstring)}
          </Typography>
        )}

        {!!token && token.symbol === 'OMG' && (
          <Typography variant="body2" sx={{mt: 2}}>
            The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
            In some cases, three interactions with MetaMask are needed.
          </Typography>
        )}

        {!isBridge  && (depositLoading || approvalLoading) && (
          <Typography variant="body2" sx={{mt: 2, color: 'green'}}>
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
          {buttonLabel_1}
        </Button>
        <Button
          onClick={doDeposit}
          color='primary'
          variant="contained"
          loading={depositLoading || approvalLoading}
          tooltip={depositLoading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to bridge your funds to L2"}
          disabled={!validValue || !Number(value)}
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
