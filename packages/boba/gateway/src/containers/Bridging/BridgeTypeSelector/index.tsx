import React from 'react'
import { BridgeTabs, BridgeTabItem } from './style'
import { useDispatch, useSelector } from 'react-redux'
import { selectBridgeType } from 'selectors'
import { setBridgeType } from 'actions/bridgeAction'

export enum BRIDGE_TYPE {
  CLASSIC = 'CLASSIC',
  FAST = 'FAST',
}

const BridgeTypeSelector = () => {
  const dispatch = useDispatch<any>()
  const bridgeType = useSelector(selectBridgeType())

  const onTabClick = (payload: any) => {
    dispatch(setBridgeType(payload))
  }

  return (
    <BridgeTabs>
      <BridgeTabItem
        active={bridgeType === BRIDGE_TYPE.CLASSIC}
        onClick={() => onTabClick(BRIDGE_TYPE.CLASSIC)}
      >
        Classic
      </BridgeTabItem>
      <BridgeTabItem
        active={bridgeType === BRIDGE_TYPE.FAST}
        onClick={() => onTabClick(BRIDGE_TYPE.FAST)}
      >
        Fast
      </BridgeTabItem>
    </BridgeTabs>
  )
}

export default BridgeTypeSelector
