import React, { FC, memo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectBridgeToAddressState } from 'selectors'
import { ReceiveContainer } from '../styles'
import { Label } from '../../styles'
import InputWithButton from 'components/global/inputWithButton'

type Props = {}

const BridgeToAddress: FC<Props> = ({}) => {
  const bridgeToAddressEnable = useSelector(selectBridgeToAddressState())

  const [toAddress, setToAddress] = useState('')

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

  if (!bridgeToAddressEnable) {
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
