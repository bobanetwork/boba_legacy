import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BN from 'bignumber.js';

import Button from 'components/button/Button';

import { exitBOBA } from 'actions/networkAction';
import { closeModal, openAlert, openModal } from 'actions/uiAction';

import { selectClassicExitCost, selectL2FeeBalance } from 'selectors/balanceSelector';

import { logAmount } from 'util/amountConvert';
import { resetToken } from 'actions/bridgeAction';
import BridgeFee from '../fee/bridgeFee';


function TransferExit({
  token
}) {
  console.log([ 'TRANSFER EXIT' ])
  const [ validValue, setValidValue ] = useState(false);
  const dispatch = useDispatch();

  const cExitCost = useSelector(selectClassicExitCost);
  const feeBalance = useSelector(selectL2FeeBalance)

  useEffect(() => {

    const maxValue = logAmount(token.balance, token.decimals);
    const tooSmall = new BN(token.amount).lte(new BN(0.0))
    const tooBig = new BN(token.amount).gt(new BN(maxValue))

    if (tooSmall || tooBig) {
      setValidValue(false)
    } else if (token.symbol === 'ETH' && (Number(cExitCost) + Number(token.amount)) > Number(feeBalance)) {
      //insufficient ETH to cover the ETH amount plus gas
      setValidValue(false)
    } else if ((Number(cExitCost) > Number(feeBalance))) {
      //insufficient ETH to pay exit fees
      setValidValue(false)
    } else {
      //Whew, finally!
      setValidValue(true)
    }

  }, [ token, setValidValue, cExitCost, feeBalance ])


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
    <BridgeFee />
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
