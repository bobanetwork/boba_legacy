import React from "react"
import * as G from '../Global.styles'

import WalletPicker from 'components/walletpicker/WalletPicker'
import AlertIcon from 'components/icons/AlertIcon'

const Connect = ({ userPrompt, accountEnabled }) => {
  if(!accountEnabled) {
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
        <WalletPicker />
      </G.LayerAlert>
    )
  }

  return null
  
}

export default Connect