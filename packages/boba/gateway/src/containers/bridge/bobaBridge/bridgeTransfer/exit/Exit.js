import React from 'react'
import { useSelector } from 'react-redux'
import { selectBridgeTokens, selectBridgeType } from 'selectors/bridgeSelector'
import { BRIDGE_TYPE } from 'util/constant'
import TransferExit from './transferExit'
import TransferFastExit from './transferFastExit'

function Exit() {

  const bridgeType = useSelector(selectBridgeType())
  const tokens = useSelector(selectBridgeTokens())

  if (bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
    return <TransferExit token={tokens[ 0 ]} />
  }

  return <TransferFastExit token={tokens[ 0 ]} />
  
}

export default React.memo(Exit)
