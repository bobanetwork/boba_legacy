import React from 'react'
import {
  BridgeAction,
  BridgeContent,
  BridgeWrapper,
  BridgeActionButton,
} from './styles'
import { Heading } from 'components/global'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountEnabled } from 'selectors'
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

  const onConnect = () => {
    dispatch(setConnect(true))
  }

  const onBridge = () => {
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
            onClick={onBridge}
            label={<Heading variant="h3">Bridge</Heading>}
          />
        )}
      </BridgeAction>
    </BridgeWrapper>
  )
}

export default Bridging
