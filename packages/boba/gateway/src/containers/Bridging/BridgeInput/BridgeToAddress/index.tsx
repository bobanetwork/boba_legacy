import React, { FC, memo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  selectBridgeToAddressState,
  selectBridgeType,
  selectLayer,
} from 'selectors'
import { ReceiveContainer } from '../styles'
import { Label } from '../../styles'
import InputWithButton from 'components/global/inputWithButton'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import { LAYER } from 'util/constant'

type Props = {}

const BridgeToAddress: FC<Props> = ({}) => {
  const bridgeToAddressEnable = useSelector(selectBridgeToAddressState())
  const layer = useSelector(selectLayer())
  const bridgeType = useSelector(selectBridgeType())

  const [toAddress, setToAddress] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  const onAddressChange = (e: any) => {
    const text = e.target.value
    setToAddress(text)
  }

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setToAddress(text)
      }
    } catch (err) {
      // navigator clipboard api not supported in client browser
    }
  }

  useEffect(() => {
    if (layer !== LAYER.L1 || bridgeType !== BRIDGE_TYPE.CLASSIC) {
      setIsAvailable(false)
    } else {
      setIsAvailable(true)
    }
  }, [layer, bridgeType])

  if (!bridgeToAddressEnable || !isAvailable) {
    return null
  }

  return (
    <ReceiveContainer>
      <Label>Destination Address</Label>
      <InputWithButton
        type="string"
        value={toAddress}
        placeholder="Enter destination address"
        buttonLabel="Paste"
        name="address"
        onButtonClick={onPaste}
        onChange={onAddressChange}
      />
    </ReceiveContainer>
  )
}

export default memo(BridgeToAddress)
