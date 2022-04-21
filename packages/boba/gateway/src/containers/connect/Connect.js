import React from "react"
import * as G from '../Global.styles'

import { useDispatch } from "react-redux"
import AlertIcon from 'components/icons/AlertIcon'
import Button from 'components/button/Button.js'

import {
  setConnectBOBA,
  setConnect
} from 'actions/setupAction'

const Connect = ({ userPrompt, accountEnabled, connectToBoba = false, layer = '' }) => {

  const dispatch = useDispatch()

  if(!accountEnabled && !connectToBoba) {
    return (
      <G.LayerAlert style={{padding: '20px'}}>
        <G.AlertInfo>
          <AlertIcon />
          <G.AlertText
            variant="body2"
            component="p"
          >
            {userPrompt}
          </G.AlertText>
        </G.AlertInfo>
        <Button
          type="primary"
          variant="contained"
          size='small'
          onClick={()=>dispatch(setConnect(true))}
        >
          Connect
        </Button>
      </G.LayerAlert>
    )
  }
  else if (layer !== 'L2' && connectToBoba) {
    return (
      <G.LayerAlert style={{padding: '20px'}}>
        <G.AlertInfo>
          <AlertIcon />
          <G.AlertText
            variant="body2"
            component="p"
          >
            {userPrompt}
          </G.AlertText>
        </G.AlertInfo>
        <Button
          type="primary"
          variant="contained"
          size='small'
          onClick={()=>dispatch(setConnectBOBA(true))}
        >
          Connect to Boba
        </Button>
      </G.LayerAlert>
    )
  }

  return null

}

export default Connect
