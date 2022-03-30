import { Box, Typography } from '@mui/material';
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
import BridgeFee from '../fee/bridgeFee';

function TransferDeposit({
  token
}) {
  console.log([ 'TRANSFER DEPOSIT', token ])

  const [ validValue, setValidValue ] = useState(false);
  const dispatch = useDispatch();

  const depositLoading = useSelector(selectLoading([ 'DEPOSIT/CREATE' ]))

  const signatureStatus = useSelector(selectSignatureStatus_depositTRAD)

  useEffect(() => {
    const maxValue = logAmount(token.balance, token.decimals)
    const tooSmall = new BN(token.amount).lte(new BN(0.0))
    const tooBig = new BN(token.amount).gt(new BN(maxValue))

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
  }, [ signatureStatus, depositLoading, dispatch ])

  const doDeposit = async () => {
    dispatch(openModal('transferPending'));
    if (token.symbol === 'ETH') {
      await dispatch(
        depositETHL2(token.toWei_String)
      )
    } else {
      await dispatch(
        depositErc20(token.toWei_String, token.address, token.addressL2)
      )
    }
    dispatch(closeModal('transferPending'));
    dispatch(resetToken());
  }

  return <>
    <BridgeFee
      time="3min - 1hr"
    />

    <Box>
      {!!token &&  token.symbol === 'OMG' && (
        <Typography variant="body2" sx={{ my: 1 }}>
          NOTE: The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
          In some cases, three interactions with MetaMask are needed. If you are bridging out of a
          new wallet, it starts out with a 0 approval, and therefore, only two interactions with
          MetaMask will be needed.
        </Typography>
      )}
    </Box>

    <Button
      color="primary"
      variant="contained"
      tooltip={"Click here to bridge your funds to L2"}
      triggerTime={new Date()}
      onClick={doDeposit}
      disabled={!validValue}
      fullWidth={true}
    >Classic Bridge</Button>
  </>
};

export default React.memo(TransferDeposit);
