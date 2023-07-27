import React, { useEffect, useState } from 'react'
import { BridgeInfoContainer, InfoRow } from '../styles'
import { Label } from '../../styles'
import {
  selectBobaFeeChoice,
  selectBobaPriceRatio,
  selectBridgeType,
  selectClassicExitCost,
  selectExitFee,
  selectFastDepositCost,
  selectFastExitCost,
  selectL1FeeRateN,
  selectL2FeeRateN,
  selectLayer,
} from 'selectors'
import { useSelector } from 'react-redux'
import { LAYER } from 'util/constant'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import useAmountToReceive from 'hooks/useAmountToReceive'
import networkService from 'services/networkService'

interface Props {}

const Fee = (props: Props) => {
  const bridgeType = useSelector(selectBridgeType())
  const layer = useSelector(selectLayer())
  const l2FeeRateN = useSelector(selectL2FeeRateN)

  const depositFee = useSelector(selectFastDepositCost)

  // required on L2 layer
  const l1FeeRateN = useSelector(selectL1FeeRateN)
  const classicExitCost = useSelector(selectClassicExitCost)
  const fastExitCost = useSelector(selectFastExitCost)
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())
  const exitFee = useSelector(selectExitFee)

  const { amount: amountToReceive } = useAmountToReceive()

  const [gasFee, setGasFee] = useState('')

  const estimateTime = () => {
    if (bridgeType === BRIDGE_TYPE.CLASSIC) {
      return '7 days'
    } else {
      if (layer === LAYER.L1) {
        return '1 ~ 5min.'
      } else {
        return '15min ~ 3hrs.'
      }
    }
  }

  useEffect(() => {
    if (layer === LAYER.L1) {
      if (bridgeType === BRIDGE_TYPE.FAST) {
        setGasFee(`${Number(depositFee)?.toFixed(4)}ETH`)
      } else {
        setGasFee(`0 ETH`)
      }
    } else {
      //TODO: add check for safecost to avoid issues. debug why gas estimation wrong
      let cost = classicExitCost || 0
      if (bridgeType === BRIDGE_TYPE.FAST) {
        cost = fastExitCost || 0
      }

      const safeCost = Number(cost) * 1.04 // 1.04 == safety margin on cost
      if (feeUseBoba) {
        setGasFee(`${Number(safeCost * feePriceRatio).toFixed(4)} BOBA`)
      } else {
        setGasFee(
          `${Number(safeCost).toFixed(4)} ${networkService.L1NativeTokenSymbol}`
        )
      }
    }
  }, [
    layer,
    bridgeType,
    depositFee,
    classicExitCost,
    fastExitCost,
    feeUseBoba,
    feePriceRatio,
  ])

  return (
    <BridgeInfoContainer>
      <InfoRow>
        <Label>Estimated time</Label>
        <Label>{estimateTime()}</Label>
      </InfoRow>
      <InfoRow>
        <Label>Destination gas fee</Label>
        <Label>{gasFee}</Label>
      </InfoRow>
      {layer === LAYER.L2 ? (
        <InfoRow>
          <Label>xChain Relay Fee</Label>
          <Label>{exitFee} BOBA</Label>
        </InfoRow>
      ) : null}
      <InfoRow>
        <Label>Bridge Fee</Label>
        <Label>{(layer === LAYER.L1 ? l2FeeRateN : l1FeeRateN) || 0}%</Label>
      </InfoRow>
      <InfoRow>
        <Label color="white">You will receive</Label>
        <Label color="white">{amountToReceive}</Label>
      </InfoRow>
    </BridgeInfoContainer>
  )
}

export default Fee
