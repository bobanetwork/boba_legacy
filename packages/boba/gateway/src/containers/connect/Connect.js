import React from 'react'
import * as G from '../Global.styles'

import { useDispatch } from 'react-redux'
import AlertIcon from 'components/icons/AlertIcon'
import Button from 'components/button/Button.js'

import { setConnectBOBA, setConnect } from 'actions/setupAction'



const Connect = ({
  userPrompt,
  accountEnabled,
  connectToBoba = false,
  layer = '',
}) => {
  const dispatch = useDispatch()
  const handleConnect = () => {
    dispatch(!accountEnabled && !connectToBoba ? setConnect(true) : setConnectBOBA(true))
  }

  return (!accountEnabled && !connectToBoba) || (layer !== 'L2' && connectToBoba) ? (
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
          size="small"
          newStyle
        onClick={handleConnect}
        sx={{fontWeight: '500;'}}
      >
        { layer !== 'L2' && connectToBoba? 'Connect to Boba' : 'Connect' }
      </Button>
    </G.LayerAlert>
    ) : (null)
  
  }


export default Connect
