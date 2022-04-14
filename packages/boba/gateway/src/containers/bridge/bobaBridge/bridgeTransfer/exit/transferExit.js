import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BN from 'bignumber.js';

import { Box, Typography } from '@mui/material';

import Button from 'components/button/Button';

import { exitBOBA } from 'actions/networkAction';
import { closeModal, openAlert, openModal } from 'actions/uiAction';

import { selectClassicExitCost, selectExitFee, selectL2BalanceBOBA, selectL2BalanceETH} from 'selectors/balanceSelector';

import { logAmount } from 'util/amountConvert'
import { resetToken } from 'actions/bridgeAction'
import BridgeFee from '../fee/bridgeFee'

import parse from 'html-react-parser'
import { selectBobaFeeChoice, selectBobaPriceRatio } from 'selectors/setupSelector'
import { fetchClassicExitCost, fetchExitFee, fetchL2BalanceBOBA, fetchL2BalanceETH } from 'actions/balanceAction'
import { selectSignatureStatus_exitTRAD } from 'selectors/signatureSelector'
import { updateSignatureStatus_exitTRAD } from 'actions/signAction'
import { selectLoading } from 'selectors/loadingSelector'

function TransferExit({
  token
}) {
  console.log([ 'TRANSFER EXIT' ])
  const [ validValue, setValidValue ] = useState(false)
  const [ errorString, setErrorString ] = useState(false)

  const [ max_Float, setMax_Float ] = useState(0.0) // support for Use Max - a number like 0.09 ETH
  const [ feeETH, setFeeETH ] = useState(0.0)
  const [ feeBOBA, setFeeBOBA ] = useState(0.0)

  const dispatch = useDispatch()

  const cost = useSelector(selectClassicExitCost);
  const feeBalanceETH = useSelector(selectL2BalanceETH)
  const feeBalanceBOBA = useSelector(selectL2BalanceBOBA)
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())

  const loading = useSelector(selectLoading(['EXIT/CREATE']))

  const signatureStatus = useSelector(selectSignatureStatus_exitTRAD)

  const exitFee = useSelector(selectExitFee)

  let estFee = ''
  if(feeETH && Number(feeETH) > 0) {
    if(feeUseBoba) {
      estFee = `${Number(feeBOBA).toFixed(4)} BOBA`
    } else {
      estFee = `${Number(feeETH).toFixed(4)} ETH`
    }
  }

  useEffect(() => {
    if (typeof(token) !== 'undefined') {
      console.log("Token:",token)
      dispatch(fetchClassicExitCost(token.address))
      dispatch(fetchL2BalanceETH())
      dispatch(fetchL2BalanceBOBA())
      dispatch(fetchExitFee())
    }
  }, [ token, dispatch ])

  useEffect(() => {
    if (signatureStatus && loading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      dispatch(closeModal('transferPending'))
      dispatch(resetToken())
      updateSignatureStatus_exitTRAD(false)
    }
  }, [ signatureStatus, loading, dispatch ])

  useEffect(() => {

    const balance = logAmount(token.balance, token.decimals)

    const tooSmall = new BN(token.amount).lte(new BN(0.0))
    const tooBig = new BN(token.amount).gt(new BN(max_Float))

    setErrorString('')

    const value = Number(token.amount)

    if (value <= 0) {
      setValidValue(false)
    }
    else if (tooSmall) {
      setValidValue(false)
    }
    else if (tooBig) {
      setValidValue(false)
    } else if (
      token.symbol === 'ETH' &&
      (value + feeETH) > balance)
    {
      // insufficient ETH to cover the ETH amount plus gas
      // due to MetaMask issue, this is needed even if you are paying in ETH
      if(feeUseBoba)
        setErrorString('Warning: ETH amount + fees > balance. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet')
      else
        setErrorString('Warning: ETH amount + fees > balance')
      setValidValue(false)
    } else if (
      feeUseBoba &&
      token.symbol === 'BOBA' &&
      (value + feeBOBA + exitFee) > balance)
    {
      // insufficient BOBA to cover the BOBA amount plus gas
      setErrorString('Warning: BOBA amount + fees > balance')
      setValidValue(false)
    } else if (
      feeETH > Number(feeBalanceETH))
    {
      if(feeUseBoba) {
        setErrorString('Warning: ETH balance too low. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet.')
      } else {
        setErrorString('Warning: ETH balance too low.')
      }      
      setValidValue(false)
    } else if (
      feeUseBoba &&
      feeBOBA > Number(feeBalanceBOBA))
    {
      // insufficient BOBA to cover exit fees
      setErrorString('Warning: BOBA balance too low to cover gas/fees')
      setValidValue(false)
    }
    else {
      //Whew, finally!
      setValidValue(true)
    }

  }, [ token, setErrorString, setValidValue, feeUseBoba, feeBOBA, feeETH, feeBalanceBOBA, feeBalanceETH, cost, max_Float ])

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


  const doExit = async () => {
    dispatch(openModal('transferPending'))

    let res = await dispatch(exitBOBA(token.address, token.toWei_String))

    dispatch(closeModal('transferPending'))
    dispatch(resetToken())

    if (res) {
      dispatch(
        openAlert(
          `${token.symbol} was bridged to L1. You will receive
          ${Number(token.amount).toFixed(3)} ${token.symbol}
          on L1 in 7 days.`
        )
      )
    }
  }

  return <>

    <BridgeFee
      time="7 Days"
      timeLabel="Your funds will be available on L1 in 7 days"
      estFee={estFee}
    />

    <Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        {parse(`Exit Fee: ${exitFee} BOBA`)}
      </Typography>

      {errorString !== '' &&
        <Typography variant="body2" sx={{ mt: 2, color: 'red' }}>
          {errorString}
        </Typography>
      }
    </Box>

    <Button
      color="primary"
      variant="contained"
      tooltip={"Click here to bridge your funds to L1"}
      triggerTime={new Date()}
      onClick={doExit}
      disabled={!validValue}
      fullWidth={true}
    >Classic Bridge</Button>
  </>
};

export default React.memo(TransferExit);
