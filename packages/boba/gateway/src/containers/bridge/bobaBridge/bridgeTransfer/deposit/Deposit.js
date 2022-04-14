import InputStep from 'containers/modals/deposit/steps/InputStep'
import InputStepFast from 'containers/modals/deposit/steps/InputStepFast'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectBridgeTokens, selectBridgeType } from 'selectors/bridgeSelector'
import { BRIDGE_TYPE } from 'util/constant'

function Deposit({ handleClose, openTokenPicker }) {

  const bridgeType = useSelector(selectBridgeType())
  const tokens = useSelector(selectBridgeTokens())

  if (bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
    return <InputStep handleClose={handleClose} openTokenPicker={openTokenPicker} isBridge={true} token={tokens[ 0 ]} />
  }

  return <InputStepFast handleClose={handleClose} openTokenPicker={openTokenPicker} isBridge={true} token={tokens[ 0 ]} />
}

export default React.memo(Deposit)
