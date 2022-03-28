import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BN from 'bignumber.js';

import Button from 'components/button/Button';

import { exitBOBA } from 'actions/networkAction';
import { closeModal, openAlert, openModal } from 'actions/uiAction';

import { selectClassicExitCost, selectL2FeeBalance } from 'selectors/balanceSelector';
import { selectLookupPrice } from 'selectors/lookupSelector'


import { amountToUsd, logAmount } from 'util/amountConvert';
import { resetToken } from 'actions/bridgeAction';
import BridgeFee from '../fee/bridgeFee';


function TransferExit({
  token
}) {
  console.log([ 'TRANSFER EXIT' ])
  const [ validValue, setValidValue ] = useState(false);
  const dispatch = useDispatch();

  const cost = useSelector(selectClassicExitCost);
  const feeBalance = useSelector(selectL2FeeBalance)
  const lookupPrice = useSelector(selectLookupPrice)

  let estFee = `${Number(cost).toFixed(4)} ETH`;

  let estFeeLabel = '';
  let estRecieveLabel = `You will receive ${Number(token.amount).toFixed(3)} ${token.symbol}
  ${!!amountToUsd(token.amount, lookupPrice, token) ? `($${amountToUsd(token.amount, lookupPrice, token).toFixed(2)})`: ''}
  on L1`

  if(cost && Number(cost) > 0) {

    if (token.symbol !== 'ETH') {
      if(Number(cost) > Number(feeBalance)) {
        estFeeLabel = `Estimated gas (approval + exit): ${Number(cost).toFixed(4)} ETH
        <br/>WARNING: your L2 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover gas.
        <br/>TRANSACTION WILL FAIL.`
      }
      else if(Number(cost) > Number(feeBalance) * 0.96) {
        estFeeLabel = `Estimated gas (approval + exit): ${Number(cost).toFixed(4)} ETH
        <br/>CAUTION: your L2 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated cost.
        <br/>TRANSACTION MIGHT FAIL. It would be safer to have slightly more ETH in your L2 wallet to cover gas.`
      }
      else {
        estFeeLabel = `Estimated gas (approval + exit): ${Number(cost).toFixed(4)} ETH`
      }
    }

    if (token.symbol === 'ETH') {
      estFee = `${(Number(token.amount) + Number(cost)).toFixed(4)} ETH`;

      if((Number(token.amount) + Number(cost)) > Number(feeBalance)) {
        estFeeLabel = `Transaction total (amount + approval + exit): ${(Number(token.amount) + Number(cost)).toFixed(4)} ETH
        <br/>WARNING: your L2 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover this transaction.
        <br/>TRANSACTION WILL FAIL.`
      }
      else if ((Number(token.amount) + Number(cost)) > Number(feeBalance) * 0.96) {
        estFeeLabel = `Transaction total (amount + approval + exit): ${(Number(token.amount) + Number(cost)).toFixed(4)} ETH
        <br/>CAUTION: your L2 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated total.
        <br/>TRANSACTION MIGHT FAIL.`
      } else {
        estFeeLabel = `Transaction total (amount + approval + exit): ${(Number(token.amount) + Number(cost)).toFixed(4)} ETH`
      }
    }
  }


  useEffect(() => {

    const maxValue = logAmount(token.balance, token.decimals);
    const tooSmall = new BN(token.amount).lte(new BN(0.0))
    const tooBig = new BN(token.amount).gt(new BN(maxValue))

    if (tooSmall || tooBig) {
      setValidValue(false)
    } else if (token.symbol === 'ETH' && (Number(cost) + Number(token.amount)) > Number(feeBalance)) {
      //insufficient ETH to cover the ETH amount plus gas
      setValidValue(false)
    } else if ((Number(cost) > Number(feeBalance))) {
      //insufficient ETH to pay exit fees
      setValidValue(false)
    } else {
      //Whew, finally!
      setValidValue(true)
    }

  }, [ token, setValidValue, cost, feeBalance ])


  const doExit = async () => {
    dispatch(openModal('transferPending'));

    let res = await dispatch(exitBOBA(token.address, token.toWei_String))

    dispatch(closeModal('transferPending'));
    dispatch(resetToken());

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
      estBridgeFee={`0%`}
      estFee={estFee}
      estFeeLabel={estFeeLabel}
      estRecieve={`${Number(token.amount).toFixed(3)} ${token.symbol}`}
      estRecieveLabel={estRecieveLabel}
      />
    <Button
      color="primary"
      variant="contained"
      tooltip={"Click here to bridge your funds to L1"}
      triggerTime={new Date()}
      onClick={doExit}
      disabled={!validValue}
      fullWidth={true}
    >Classic Bridge</Button></>
};

export default React.memo(TransferExit);
