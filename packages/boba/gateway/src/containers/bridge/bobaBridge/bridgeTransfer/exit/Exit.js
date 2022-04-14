import DoExitStep from 'containers/modals/exit/steps/DoExitStep'
import DoExitStepFast from 'containers/modals/exit/steps/DoExitStepFast'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectBridgeTokens, selectBridgeType } from 'selectors/bridgeSelector'
import { BRIDGE_TYPE } from 'util/constant'

function Exit({handleClose, openTokenPicker}) {

  const bridgeType = useSelector(selectBridgeType())
  const tokens = useSelector(selectBridgeTokens())

  if (bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
    return <DoExitStep handleClose={handleClose} openTokenPicker={openTokenPicker} isBridge={true} token={tokens[0]}/>
  }
  return <DoExitStepFast handleClose={handleClose} openTokenPicker={openTokenPicker} isBridge={true} token={tokens[0]} />

}

export default React.memo(Exit)
