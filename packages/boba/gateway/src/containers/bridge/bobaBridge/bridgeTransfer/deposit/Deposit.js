import React from 'react'
import { useSelector } from 'react-redux'
import { selectBridgeTokens, selectBridgeType } from 'selectors/bridgeSelector'
import { BRIDGE_TYPE } from 'util/constant'
import TransferDeposit from './transferDeposit'
import TransferFastDeposit from './transferFastDeposit'
import TransferFastDepositBatch from './transferFastDepositBatch'

function Deposit() {

  const bridgeType = useSelector(selectBridgeType())
  const tokens = useSelector(selectBridgeTokens())

  if (bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
    return <TransferDeposit token={tokens[ 0 ]} />
  }

  return <TransferFastDeposit token={tokens[ 0 ]} />
}

export default React.memo(Deposit)
