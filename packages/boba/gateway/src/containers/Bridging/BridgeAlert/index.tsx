import React, { FC } from 'react'

import { useSelector } from 'react-redux'
import { selectBridgeAlerts } from 'selectors'
import { AlertContainer, AlertIcon, AlertText } from './index.styles'

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
            <AlertContainer>
              <AlertIcon />
              <AlertText>{alert.text}</AlertText>
            </AlertContainer>
          )
        })}
    </>
  )
}

export default BridgeAlert
