import React from 'react'
import { BridgeTabs, BridgeTabItem } from './style'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectActiveNetworkType,
  selectBridgeType,
  selectNetworkType,
} from 'selectors'
import { setBridgeType } from 'actions/bridgeAction'
import { NETWORK_TYPE } from '../../../util/network/network.util'

export enum BRIDGE_TYPE {
  CLASSIC = 'CLASSIC',
  FAST = 'FAST',
  TELEPORTATION = 'TELEPORTATION',
}
const BridgeTypeSelector = () => {
  const dispatch = useDispatch<any>()
  const bridgeType = useSelector(selectBridgeType())

  // Only show teleportation on testnet for now
  const isTestnet =
    useSelector(selectActiveNetworkType()) === NETWORK_TYPE.TESTNET

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

      {isTestnet ? (
        <BridgeTabItem
          active={bridgeType === BRIDGE_TYPE.TELEPORTATION}
          onClick={() => onTabClick(BRIDGE_TYPE.TELEPORTATION)}
        >
          Now
        </BridgeTabItem>
      ) : null}
    </BridgeTabs>
  )
}

export default BridgeTypeSelector
