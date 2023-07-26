import React from 'react'
import {
  BridgeAction,
  BridgeContent,
  BridgeWrapper,
  BridgeActionButton,
} from './styles'
import { Heading } from 'components/global'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAccountEnabled,
  selectAmountToBridge,
  selectBridgeAlerts,
  selectTokenToBridge,
} from 'selectors'
import { setConnect } from 'actions/setupAction'
import Chains from './chain'
import BridgeInput from './BridgeInput'
import BridgeAlert from './BridgeAlert'
import BridgeTypeSelector from './BridgeTypeSelector'
import BridgeHeader from './BridgeHeader'
import useBridgeCleanup from 'hooks/useBridgeCleanup'
import { openModal } from 'actions/uiAction'

const Bridging = () => {
  useBridgeCleanup()

  const dispatch = useDispatch<any>()
  const accountEnabled = useSelector<any>(selectAccountEnabled())
  const token = useSelector(selectTokenToBridge())
  const amountToBridge = useSelector(selectAmountToBridge())
  const bridgeAlerts = useSelector(selectBridgeAlerts())

  const isBridgeActionDisabled = () => {
    const hasError = bridgeAlerts.find((alert: any) => alert.type === 'error')
    return !token || !amountToBridge || hasError
  }

  const onConnect = () => {
    dispatch(setConnect(true))
  }

  const onBridge = () => {
    if (isBridgeActionDisabled()) {
      return
    }
    dispatch(openModal('bridgeConfirmModal'))
  }

  return (
    <BridgeWrapper>
      <BridgeContent>
        <BridgeHeader />
        <BridgeAlert />
        <BridgeTypeSelector />
        <Chains />
        <BridgeInput />
      </BridgeContent>
      <BridgeAction>
        {!accountEnabled ? (
          <BridgeActionButton
            onClick={onConnect}
            label={<Heading variant="h3"> Connect Wallet</Heading>}
          />
        ) : (
          <BridgeActionButton
            disable={isBridgeActionDisabled()}
            onClick={onBridge}
            label={<Heading variant="h3">Bridge</Heading>}
          />
        )}
      </BridgeAction>
    </BridgeWrapper>
  )
}

export default Bridging
