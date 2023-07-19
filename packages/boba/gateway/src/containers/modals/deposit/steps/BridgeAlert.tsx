import { Text } from 'components/global/text'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'selectors'
import styled from 'styled-components'

import { bridgeAlerts } from './alertConfig'

const AlertText = styled(Text)`
  color: ${(props) => props.theme.warning};
  font-size: 16px;
  font-weight: 700;
  margin: 5px 0px;
`

const BridgeAlert = () => {
  const activeNetwork = useSelector(selectActiveNetwork())

  const alertCaption = bridgeAlerts[activeNetwork]

  if (alertCaption) {
    return <AlertText>{alertCaption}</AlertText>
  }

  return <></>
}

export default BridgeAlert
