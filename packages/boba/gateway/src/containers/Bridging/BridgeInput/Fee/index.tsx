import React from 'react'
import { BridgeInfoContainer, InfoRow } from '../styles'
import { Label } from '../../styles'

interface Props {}

const Fee = (props: Props) => {
  return (
    <BridgeInfoContainer>
      <InfoRow>
        <Label>Estimated time</Label>
        <Label>1 ~ 5 min.</Label>
      </InfoRow>
      <InfoRow>
        <Label>Destination gas fee</Label>
        <Label>0.00038 ETH</Label>
      </InfoRow>
      <InfoRow>
        <Label>Bridge Fee</Label>
        <Label>0.000005 ETH</Label>
      </InfoRow>
      <InfoRow>
        <Label>You will receve</Label>
        <Label>0.4923 ETH</Label>
      </InfoRow>
    </BridgeInfoContainer>
  )
}

export default Fee
