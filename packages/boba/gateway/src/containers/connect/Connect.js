import React from "react"
import * as G from '../Global.styles'

import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'

const Connect = ({ userPrompt, accountEnabled, connectToBoba = false, layer = '' }) => {
  
  if(!accountEnabled && !connectToBoba) {
    return (
      <G.LayerAlert>
        <G.AlertInfo>
          <AlertIcon />
          <G.AlertText
            variant="body2"
            component="p"
          >
            {userPrompt}
          </G.AlertText>
        </G.AlertInfo>
        <LayerSwitcher buttonConnect={true}/>
      </G.LayerAlert>
    )
  }
  else if (layer !== 'L2' && connectToBoba) {
    return (
      <G.LayerAlert>
        <G.AlertInfo>
          <AlertIcon />
          <G.AlertText
            variant="body2"
            component="p"
          >
            {userPrompt}
          </G.AlertText>
        </G.AlertInfo>
        <LayerSwitcher buttonConnectToBoba={true}/>
      </G.LayerAlert>
    )
  }

  return null
  
}

export default Connect


