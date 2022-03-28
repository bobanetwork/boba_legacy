import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BN from 'bignumber.js';

import Button from 'components/button/Button';

import { closeModal, openAlert, openModal } from 'actions/uiAction';

import { selectFastExitCost, selectL1FeeRate, selectL1FeeRateN, selectL1LPBalanceString, selectL1LPLiquidity, selectL1LPPendingString, selectL2FeeBalance } from 'selectors/balanceSelector';

import { logAmount } from 'util/amountConvert';
import { fetchFastExitCost, fetchL1FeeRateN, fetchL1LPBalance, fetchL1LPLiquidity, fetchL1LPPending, fetchL1TotalFeeRate, fetchL2FeeBalance } from 'actions/balanceAction';
import { depositL2LP } from 'actions/networkAction';
import { selectSignatureStatus_exitLP } from 'selectors/signatureSelector';
import { selectLoading } from 'selectors/loadingSelector';
import { resetToken } from 'actions/bridgeAction';
import BridgeFee from '../fee/bridgeFee';


function TransferFastExit({
  token
}) {
  console.log([ 'TRANSFER FAST EXIT' ])
  const dispatch = useDispatch();
  const [ validValue, setValidValue ] = useState(false);
  const [ LPRatio, setLPRatio ] = useState(0)


  const cost = useSelector(selectFastExitCost)
  const LPBalance = useSelector(selectL1LPBalanceString)
  const LPPending = useSelector(selectL1LPPendingString)
  const LPLiquidity = useSelector(selectL1LPLiquidity)
  const feeBalance = useSelector(selectL2FeeBalance)
  // eslint-disable-next-line no-unused-vars
  const feeRate = useSelector(selectL1FeeRate)
  const feeRateN = useSelector(selectL1FeeRateN)

  const loading = useSelector(selectLoading([ 'EXIT/CREATE' ]))
  const signatureStatus = useSelector(selectSignatureStatus_exitLP)

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
      dispatch(fetchL2FeeBalance())
    }
    // to clean up state and fix the
    // error in console for max state update.
    return () => {
      dispatch({ type: 'BALANCE/L1/RESET' })
    }
  }, [ token, dispatch ])

  useEffect(() => {
    const maxValue = logAmount(token.balance, token.decimals)
    const tooSmall = new BN(token.amount).lte(new BN(0.0))
    const tooBig = new BN(token.amount).gt(new BN(maxValue))
    const lpUnits = logAmount(LPBalance, token.decimals)
    const balanceSubPending = lpUnits - logAmount(LPPending, token.decimals) //subtract the in flight exits

    if (tooSmall || tooBig) {
      setValidValue(false)
    } else if (token.symbol === 'ETH' && (Number(cost) + Number(token.amount)) > Number(feeBalance)) {
      //insufficient ETH to cover the ETH amount plus gas
      setValidValue(false)
    } else if ((Number(cost) > Number(feeBalance))) {
      //insufficient ETH to pay exit fees
      setValidValue(false)
    } else if (Number(LPRatio) < 0.1) {
      //not enough balance/liquidity ratio
      //we always want some balance for unstaking
      setValidValue(false)
    } else if (Number(token.amount) > Number(balanceSubPending) * 0.9) {
      //not enough absolute balance
      //we don't want one large bridge to wipe out all the balance
      //NOTE - this logic still allows bridgers to drain the entire pool, but just more slowly than before
      //this is because the every time someone exits, the limit is recalculated
      //via Number(LPBalance) * 0.9, and LPBalance changes over time
      setValidValue(false)
    } else {
      //Whew, finally!
      setValidValue(true)
    }
  }, [ token, setValidValue, cost, feeBalance, LPBalance, LPPending, LPRatio ])

  const receivableAmount = (value) => {
    return (Number(value) * ((100 - Number(feeRateN)) / 100)).toFixed(3)
  }

  useEffect(() => {
    if (signatureStatus && loading) {

      //we are all set - can close the window
      //transaction has been sent and signed
      dispatch(closeModal('transferPending'));
      dispatch(resetToken());

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
      dispatch(resetToken());
    }
  }

  return <>
    <BridgeFee />
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
