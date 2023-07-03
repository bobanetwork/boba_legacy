import React from 'react'
import * as G from '../Global.styles'

import { useDispatch } from 'react-redux'
import AlertIcon from 'components/icons/AlertIcon'
import {Button} from 'components/global/button'

import { setConnectBOBA, setConnect } from 'actions/setupAction'

const Connect = ({
  userPrompt,
  accountEnabled,
  connectToBoba = false,
  layer = '',
}) => {
  const dispatch = useDispatch()

  if (!accountEnabled && !connectToBoba) {
    return (
      <G.LayerAlert style={{ padding: '20px' }}>
        <G.AlertInfo>
          <AlertIcon />
          <G.AlertText variant="body2" component="p">
            {userPrompt}
          </G.AlertText>
        </G.AlertInfo>
        <Button
          onClick={() => dispatch(setConnect(true))}
          label="Connect"
          small
        />
      </G.LayerAlert>
    )
  } else if (layer !== 'L2' && connectToBoba) {
    return (
      <G.LayerAlert style={{ padding: '20px' }}>
        <G.AlertInfo>
          <AlertIcon />
          <G.AlertText variant="body2" component="p">
            {userPrompt}
          </G.AlertText>
        </G.AlertInfo>
        <Button
          small
          onClick={() => dispatch(setConnectBOBA(true))}
          label="Connect to Boba"
        />
      </G.LayerAlert>
    )
  }

  return null
}

export default Connect
