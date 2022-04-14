import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';

import BN from 'bignumber.js';

import Button from 'components/button/Button';

import { closeModal, openAlert, openModal } from 'actions/uiAction';

import { selectExitFee, selectFastExitCost, selectL1FeeRate, selectL1FeeRateN, selectL1LPBalanceString, selectL1LPLiquidity, selectL1LPPendingString, selectL2BalanceBOBA, selectL2BalanceETH } from 'selectors/balanceSelector';

import { amountToUsd, logAmount } from 'util/amountConvert';
import { fetchExitFee, fetchFastExitCost, fetchL1FeeRateN, fetchL1LPBalance, fetchL1LPLiquidity, fetchL1LPPending, fetchL1TotalFeeRate, fetchL2BalanceBOBA, fetchL2BalanceETH } from 'actions/balanceAction';
import { depositL2LP } from 'actions/networkAction';
import { selectSignatureStatus_exitLP } from 'selectors/signatureSelector';
import { selectLoading } from 'selectors/loadingSelector';
import { resetToken } from 'actions/bridgeAction';
import BridgeFee from '../fee/bridgeFee';
import { selectLookupPrice } from 'selectors/lookupSelector';

import parse from 'html-react-parser'
import { selectBobaFeeChoice, selectBobaPriceRatio } from 'selectors/setupSelector';
import { updateSignatureStatus_exitLP } from 'actions/signAction';

function TransferFastExit({
  token
}) {
  console.log([ 'TRANSFER FAST EXIT' ])
  const dispatch = useDispatch();
  const [ validValue, setValidValue ] = useState(false);
  const [ LPRatio, setLPRatio ] = useState(0)

  const [ feeETH, setFeeETH ] = useState(0.0)
  const [ feeBOBA, setFeeBOBA ] = useState(0.0)
  const [ errorString, setErrorString ] = useState('')
  const [ max_Float, setMax_Float ] = useState(0.0) // support for Use Max - a number like 0.09 ETH

  const cost = useSelector(selectFastExitCost)
  const LPBalance = useSelector(selectL1LPBalanceString)
  const LPPending = useSelector(selectL1LPPendingString)
  const LPLiquidity = useSelector(selectL1LPLiquidity)

  const feeBalanceETH = useSelector(selectL2BalanceETH)
  const feeBalanceBOBA = useSelector(selectL2BalanceBOBA)
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())

  const exitFee = useSelector(selectExitFee)

  const lookupPrice = useSelector(selectLookupPrice)
  // eslint-disable-next-line no-unused-vars
  const feeRate = useSelector(selectL1FeeRate)
  const feeRateN = useSelector(selectL1FeeRateN)

  const loading = useSelector(selectLoading([ 'EXIT/CREATE' ]))
  const signatureStatus = useSelector(selectSignatureStatus_exitLP)

  const lpUnits = logAmount(LPBalance, token.decimals)
  const balanceSubPending = lpUnits - logAmount(LPPending, token.decimals) //subtract the in flight exits


  const bridgeFee = `${feeRateN}%`;
  const bridgeFeeLabel = `The fee varies between ${feeRate.feeMin} and ${feeRate.feeMax}%. The current fee is ${feeRateN}%.`

  let estReceiveLabel = ''
  let estFee = ''
  let estFeeLabel = null;

  if (feeETH && Number(feeETH) > 0) {
    if (feeUseBoba) {
      estFee = `${Number(feeBOBA).toFixed(4)} BOBA`;
    } else {
      estFee = `${Number(feeETH).toFixed(4)} ETH`;
    }
  }
  /* console.group(['fee'])
  console.log([`feeBOBA`,feeBOBA])
  console.log([`feeETH`,feeETH])
  console.log([`estFee`,estFee])
  console.groupEnd(['fee']) */

  useEffect(() => {
    const lbl = Number(logAmount(LPLiquidity, token.decimals))
    if (lbl > 0) {
      const lbp = Number(logAmount(LPBalance, token.decimals))
      const LPR = lbp / lbl
      setLPRatio(Number(LPR).toFixed(3))
    }
  }, [ LPLiquidity, LPBalance, token ])

  useEffect(() => {
    if (typeof (token) !== 'undefined') {
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
    return () => {
      dispatch({ type: 'BALANCE/L1/RESET' })
    }
  }, [ token, dispatch ])

  useEffect(() => {
    const balance = logAmount(token.balance, token.decimals)
    const tooSmall = new BN(token.amount).lte(new BN(0.0))
    const tooBig = new BN(token.amount).gt(new BN(max_Float))

    setErrorString('')

    if (tooSmall) {
      // setErrorString('Warning: Value too small')
      setValidValue(false)
    } else if (tooBig) {
      // setErrorString('Warning: Value too big')
      setValidValue(false)
    } else if (
      token.symbol === 'ETH' &&
      (Number(token.amount) + feeETH) > balance) {
      if (feeUseBoba) {
        setErrorString('Warning: ETH amount + fees > balance. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet')
      } else {
        setErrorString('Warning: ETH amount + fees > balance')
      }
      setValidValue(false)
    }
    else if (
      //pay BOBA, exit BOBA - check BOBA amount
      feeUseBoba &&
      token.symbol === 'BOBA' &&
      (Number(token.amount) + feeBOBA + exitFee) > balance)
    {
        // insufficient BOBA to cover the BOBA amount plus gas plus exitFee
      setErrorString('Warning: BOBA amount + fees > balance')
      setValidValue(false)
    }
    else if (feeETH > Number(feeBalanceETH)) {
      // insufficient ETH to cover exit fees
      // it does not matter if you are paying in ETH or BOBA
      if (feeUseBoba) {
        setErrorString('Warning: ETH balance too low. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet')
      }
      else {
        setErrorString('Warning: ETH balance too low to cover gas')
      }
      setValidValue(false)
    } else if (
      // insufficient BOBA to cover exit fees
      feeUseBoba &&
      (feeBOBA + exitFee) > Number(feeBalanceBOBA)
    ) {
      setErrorString('Warning: BOBA balance too low to cover gas/fees')
      setValidValue(false)
    }
    else if (Number(LPRatio) < 0.1) {
      //not enough balance/liquidity ratio
      //we always want some balance for unstaking
      setErrorString('Warning: Insufficient balance in pool - reduce amount or use classical exit')
      setValidValue(false)
    } else if (Number(token.amount) > Number(balanceSubPending) * 0.9) {
      //not enough absolute balance
      //we don't want one large bridge to wipe out all the balance
      //NOTE - this logic still allows bridgers to drain the entire pool, but just more slowly than before
      //this is because the every time someone exits, the limit is recalculated
      //via Number(LPBalance) * 0.9, and LPBalance changes over time
      setErrorString('Warning: Insufficient balance in pool - reduce amount or use classical exit')
      setValidValue(false)
    } else {
      //Whew, finally!
      setValidValue(true)
    }
  }, [ token, setValidValue, setErrorString, feeBalanceBOBA, feeBalanceETH, feeUseBoba, feeBOBA, feeETH, max_Float, balanceSubPending, LPRatio ])


  useEffect(() => {
    function estimateMax() {

      const safeCost = Number(cost) * 1.04 // 1.04 = safety margin on the cost

      //console.log("ETH fees:", safeCost)
      //console.log("BOBA fees:", safeCost * feePriceRatio)

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
      } else if (token.symbol === 'BOBA' && !feeUseBoba) {
        if (balance - exitFee > 0.0)
          setMax_Float(balance - exitFee)
        else
          setMax_Float(0.0)
      }
      else {
        setMax_Float(balance)
      }
    }
    if (Number(cost) > 0) estimateMax()
  }, [ token, cost, feeUseBoba, feePriceRatio ])

  const receivableAmount = (value) => {
    return (Number(token.amount) * ((100 - Number(feeRateN)) / 100)).toFixed(3)
  }


  if (token.amount) {
    estReceiveLabel = `You will receive approximately
    ${receivableAmount(token.amount)}
    ${token.symbol}
    ${!!amountToUsd(token.amount, lookupPrice, token) ? `($${amountToUsd(token.amount, lookupPrice, token).toFixed(2)})` : ''}
    on L1.`
  }


  useEffect(() => {
    if (signatureStatus && loading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      dispatch(closeModal('transferPending'));
      dispatch(resetToken());
      //make it false to avoid one more call on changes of other
      updateSignatureStatus_exitLP(false);

    }
  }, [ signatureStatus, loading, dispatch ])

  const doFastExit = async () => {
    dispatch(openModal('transferPending'));
    let res = await dispatch(
      depositL2LP(
        token.address,
        token.toWei_String
      )
    )

    if (res) {
      dispatch(
        openAlert(
          `${token.symbol} was bridged. You will receive approximately
            ${receivableAmount(token.amount)} ${token.symbol} on L1.`
        )
      );
      // dispatch(resetToken());
    }
  }

  return <>
    <BridgeFee
      time="20mins - 3hrs"
      timeLabel="In most cases, a fast bridge takes less than 20 minutes. However, if Ethereum is congested, it can take as long as 3 hours."
      estBridgeFee={bridgeFee}
      estBridgeFeeLabel={bridgeFeeLabel}
      estFee={estFee}
      estFeeLabel={estFeeLabel}
      estReceive={`${receivableAmount(token.amount)}  ${token.symbol}`}
      estReceiveLabel={estReceiveLabel}
    />
    <Box>


      <Typography variant="body2" sx={{ mt: 2 }}>
        {parse(`Message Relay Fee: ${exitFee} BOBA`)}
      </Typography>

      <Typography variant="body2" sx={{ mt: 2 }}>
        {parse(`Max exitable balance (balance - fees): ${Number(max_Float).toFixed(6)} ${token.symbol}`)}
      </Typography>

      {errorString !== '' &&
        <Typography variant="body2" sx={{ mt: 2, color: 'red' }}>
          {errorString}
        </Typography>
      }

      {(Number(LPRatio) < 0.10 && Number(token.amount) > Number(balanceSubPending) * 0.90) && (
        <Typography variant="body2" sx={{ mt: 2, color: 'red' }}>
          The pool's balance and balance/liquidity ratio are too low.
          Please use the classic bridge.
        </Typography>
      )}

      {(Number(LPRatio) < 0.10 && Number(token.amount) <= Number(balanceSubPending) * 0.90) && (
        <Typography variant="body2" sx={{ mt: 2, color: 'red' }}>
          The pool's balance/liquidity ratio (of {Number(LPRatio).toFixed(2)}) is too low.
          Please use the classic bridge.
        </Typography>
      )}

      {(Number(LPRatio) >= 0.10 && Number(token.amount) > Number(balanceSubPending) * 0.90) && (
        <Typography variant="body2" sx={{ mt: 2, color: 'red' }}>
          The pool's balance (of {Number(balanceSubPending).toFixed(2)} including inflight bridges) is too low.
          Please use the classic bridge or reduce the amount.
        </Typography>
      )}
    </Box>
    <Button
      color="primary"
      variant="contained"
      tooltip={"Click here to bridge your funds to L1"}
      triggerTime={new Date()}
      onClick={doFastExit}
      disabled={!validValue}
      fullWidth={true}
    >Fast Bridge</Button>
  </>
};

export default React.memo(TransferFastExit);
