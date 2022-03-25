import { resetToken } from 'actions/bridgeAction';
import { depositErc20, depositETHL2 } from 'actions/networkAction';
import { closeModal, openModal } from 'actions/uiAction';
import BN from 'bignumber.js';
import Button from 'components/button/Button';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectLoading } from 'selectors/loadingSelector';
import { selectSignatureStatus_depositTRAD } from 'selectors/signatureSelector';
import { logAmount } from 'util/amountConvert';

function TransferDeposit({
  token
}) {
  console.log(['TRANSFER DEPOSIT'])

  const [ validValue, setValidValue ] = useState(false);
  const dispatch = useDispatch();
  
  const depositLoading = useSelector(selectLoading(['DEPOSIT/CREATE']))

  const signatureStatus = useSelector(selectSignatureStatus_depositTRAD)

  useEffect(() => {
    const maxValue = logAmount(token.balance, token.decimals)
    const tooSmall = new BN(token.amount).lte(new BN(0.0))
    const tooBig   = new BN(token.amount).gt(new BN(maxValue))

    if (tooSmall || tooBig) {
      setValidValue(false)
    } else {
      setValidValue(true)
    }


  }, [ token, setValidValue ])

  useEffect(() => {
    if (signatureStatus && depositLoading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      dispatch(closeModal('transferPending'));
      dispatch(resetToken());
    }
  }, [ signatureStatus, depositLoading, dispatch])

  const doDeposit = async () => {
    dispatch(openModal('transferPending'));
    let res;
    if(token.symbol === 'ETH') {
      res = await dispatch(
        depositETHL2(token.toWei_String)
      )
    } else {
      res = await dispatch(
        depositErc20(token.toWei_String, token.address, token.addressL2)
      )
    }
    console.log([ 'Depositing Modal', res ]);
    dispatch(closeModal('transferPending'));
    dispatch(resetToken());
  }

  return <Button
    color="primary"
    variant="contained"
    tooltip={"Click here to bridge your funds to L2"}
    triggerTime={new Date()}
    onClick={doDeposit}
    disabled={!validValue}
    fullWidth={true}
  >Transfer</Button>
};

export default React.memo(TransferDeposit);
