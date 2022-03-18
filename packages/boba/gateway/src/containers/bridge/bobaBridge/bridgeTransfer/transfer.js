import Button from 'components/button/Button';
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectClassicExitCost, selectFastDepositCost, selectFastExitCost, selectL2FeeBalance } from 'selectors/balanceSelector';
import { selectBridgeType, selectTokenAmounts } from 'selectors/bridgeSelector';
import { selectLayer } from 'selectors/setupSelector';
import { BRIDGE_TYPE } from 'util/constant';

function BridgeTransferAction() {
  const [ validValue, setValidValue ] = useState();
  const dispatch = useDispatch();
  const tokenAmounts = useSelector(selectTokenAmounts());
  const bridgeType = useSelector(selectBridgeType());
  const layer = useSelector(selectLayer());

  const cExitCost = useSelector(selectClassicExitCost);
  const fExitCost = useSelector(selectFastExitCost);
  const fDepositCost = useSelector(selectFastDepositCost);

  const feeBalance = useSelector(selectL2FeeBalance)
  
  
  const doDeposit = () => {
    
  }
  const doFastDeposit = () => {
    
  }
  const doFastExit = () => {
    
  }
  const doExit = () => {
    
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
    fullWidth={true}
    onClick={onSubmit}
    disabled={!validValue}
  >Transfer</Button>
};

export default React.memo(BridgeTransferAction);
