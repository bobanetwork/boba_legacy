import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BN from 'bignumber.js';

import Button from 'components/button/Button';

import { exitBOBA } from 'actions/networkAction';
import { closeModal, openAlert, openModal } from 'actions/uiAction';

import { selectClassicExitCost, selectL2FeeBalance } from 'selectors/balanceSelector';
import { selectBridgeType } from 'selectors/bridgeSelector';
import { selectLayer } from 'selectors/setupSelector';

import { logAmount } from 'util/amountConvert';
import { BRIDGE_TYPE } from 'util/constant';


function BridgeTransferAction({
  tokens
}) {
  const [ validValue, setValidValue ] = useState(false);
  const dispatch = useDispatch();
  const bridgeType = useSelector(selectBridgeType());
  const layer = useSelector(selectLayer());

  const cExitCost = useSelector(selectClassicExitCost);
  // const fExitCost = useSelector(selectFastExitCost);
  // const fDepositCost = useSelector(selectFastDepositCost);

  const feeBalance = useSelector(selectL2FeeBalance)
  
  useEffect(() => {
    tokens.forEach((token) => {
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
    })
  }, [ tokens, setValidValue, cExitCost, feeBalance ])

  
  const onTxStart = () => {
    dispatch(openModal('transferPending'));
  }
  
  const onTxStop = () => {
    dispatch(closeModal('transferPending'));
  }
  
  const doDeposit = () => {

  }

  const doFastDeposit = () => {

  }

  const doFastExit = () => {

  }

  const doExit = async () => {
    onTxStart();
    let res = await dispatch(exitBOBA(tokens[ 0 ].address, tokens[ 0 ].toWei_String))
    onTxStop();
    
    if (res) {
      dispatch(
        openAlert(
          `${tokens[ 0 ].symbol} was bridged to L1. You will receive
          ${Number(tokens[ 0 ].amount).toFixed(3)} ${tokens[ 0 ].symbol}
          on L1 in 7 days.`
        )
      )
    }
  }


  const onSubmit = () => {
    if (layer === 'L1') {
      if (bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
        doDeposit()
      } else {
        doFastDeposit()
      }
    } else {
      if (bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
        doExit()
      } else {
        doFastExit()
      }
    }
  }

  return <Button
    color="primary"
    variant="contained"
    tooltip={layer === 'L1' ? "Click here to bridge your funds to L2" : "Click here to bridge your funds to L1"}
    triggerTime={new Date()}
    onClick={onSubmit}
    disabled={!validValue}
    fullWidth={true}
  >Transfer</Button>
};

export default React.memo(BridgeTransferAction);
