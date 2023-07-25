import React from 'react'
import { BridgeInfoContainer, InfoRow } from '../styles'
import { Label } from '../../styles'
import { selectBridgeType, selectLayer } from 'selectors'
import { useSelector } from 'react-redux'
import { LAYER } from 'util/constant'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import useAmountToReceive from 'hooks/useAmountToReceive'

interface Props {}

const Fee = (props: Props) => {
  const bridgeType = useSelector(selectBridgeType())
  const layer = useSelector(selectLayer())
  const { amount: amountToReceive } = useAmountToReceive()

  const estimateTime = () => {
    if (layer === LAYER.L1) {
      if (bridgeType === BRIDGE_TYPE.CLASSIC) {
        return '7 days'
      } else {
        return '1 ~ 5 min.'
      }
    }
  }

  return (
    <BridgeInfoContainer>
      <InfoRow>
        <Label>Estimated time</Label>
        <Label>{estimateTime()}</Label>
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
        <Label>You will receive</Label>
        <Label>{amountToReceive}</Label>
      </InfoRow>
    </BridgeInfoContainer>
  )
}

export default Fee
