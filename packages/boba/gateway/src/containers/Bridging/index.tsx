import { setConnect } from 'actions/setupAction'
import { openModal } from 'actions/uiAction'
import { Heading } from 'components/global'
import useBridgeCleanup from 'hooks/useBridgeCleanup'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAccountEnabled,
  selectAmountToBridge,
  selectBridgeAlerts,
  selectTokenToBridge,
} from 'selectors'
import BridgeAlert from './BridgeAlert'
import BridgeHeader from './BridgeHeader'
import BridgeInput from './BridgeInput'
import BridgeTypeSelector from './BridgeTypeSelector'
import ThirdPartyBridges from './ThirdPartyBridges'
import Chains from './chain'
import {
  BridgeAction,
  BridgeActionButton,
  BridgeContent,
  BridgeWrapper,
  BridginContainer,
} from './styles'
import useBridgeAlerts from 'hooks/useBridgeAlerts'

const Bridging = () => {
  useBridgeCleanup()
  useBridgeAlerts()

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
    <BridginContainer id={'bridge'}>
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
      <ThirdPartyBridges />
    </BridginContainer>
  )
}

export default Bridging
