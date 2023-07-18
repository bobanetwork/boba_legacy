import React from 'react'

import { InputContainer, InputContainerLabel } from './index.styles'
import { useSelector } from 'react-redux'
import { selectLayer, selectTokenToBridge } from 'selectors'
import { logAmount } from 'util/amountConvert'
import InputWithButton from 'components/global/inputWithButton'
import { LAYER } from 'util/constant'

interface Props {}

const TokenInput = (props: Props) => {
  const layer = useSelector(selectLayer())
  const token = useSelector(selectTokenToBridge())

  return (
    <InputContainer>
      <InputContainerLabel>
        Balance: {token ? logAmount(token.balance, token.decimals, 4) : ''}{' '}
        {token ? token.symbol : ''}
      </InputContainerLabel>
      <InputWithButton
        placeholder={`Amount to bridge to ${layer === LAYER.L1 ? 'L2' : 'L1'}`}
        buttonLabel="max"
        name="bridgeAmount"
        onButtonClick={() => {
          console.log('onMax Click')
        }}
        onChange={() => {
          console.log('On Changing input.')
        }}
      />
    </InputContainer>
  )
}

export default TokenInput
