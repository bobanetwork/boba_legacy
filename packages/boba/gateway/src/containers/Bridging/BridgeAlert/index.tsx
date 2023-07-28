import React, { FC } from 'react'

import { useSelector } from 'react-redux'
import { selectBridgeAlerts } from 'selectors'
import {
  AlertContainer,
  ErrorIcon,
  AlertText,
  WarningIcon,
  InfoIcon,
} from './index.styles'

const BridgeAlert: FC = () => {
  const alerts = useSelector(selectBridgeAlerts())

  if (!alerts.length) {
    return null
  }

  return (
    <>
      {alerts &&
        alerts.map((alert: any) => {
          return (
            <AlertContainer key={alert.meta} type={alert.type}>
              {alert.type === 'error' && <ErrorIcon />}
              {alert.type === 'warning' && <WarningIcon />}
              {alert.type === 'info' && <InfoIcon />}
              <AlertText>{alert.text}</AlertText>
            </AlertContainer>
          )
        })}
    </>
  )
}

export default BridgeAlert
