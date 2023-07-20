import React, { useEffect, useState } from 'react'
import { InputContainer, InputContainerLabel } from './index.styles'
import { useDispatch, useSelector } from 'react-redux'
import { selectLayer, selectTokenToBridge } from 'selectors'
import { logAmount } from 'util/amountConvert'
import InputWithButton from 'components/global/inputWithButton'
import { LAYER } from 'util/constant'
import BN from 'bignumber.js'
import { clearBridgeAlert, setBridgeAlert } from 'actions/bridgeAction'

interface Props {}

const TokenInput = (props: Props) => {
  const dispatch = useDispatch<any>()
  const layer = useSelector(selectLayer())
  const token = useSelector(selectTokenToBridge())

  const [tokenAmount, setTokenAmount] = useState('')

  useEffect(() => {
    // on changing token reset token amount.
    setTokenAmount('')
  }, [token])

  const onSetMaxAmount = () => {
    const maxValue = logAmount(token.balance, token.decimals)
    setTokenAmount(maxValue)
  }

  const onAmountChange = (value: string) => {
    const maxValue = logAmount(token.balance, token.decimals)
    const underZero = new BN(value).lt(new BN(0.0))
    const overMax = new BN(value).gt(new BN(maxValue))

    dispatch(
      clearBridgeAlert({
        keys: ['VALUE_TOO_SMALL', 'VALUE_TOO_LARGE'],
      })
    )

    if (underZero) {
      dispatch(
        setBridgeAlert({
          meta: 'VALUE_TOO_SMALL',
          type: 'error',
          text: `Value too small: the value must be greater than 0`,
        })
      )
    } else if (overMax) {
      dispatch(
        setBridgeAlert({
          meta: 'VALUE_TOO_LARGE',
          type: 'error',
          text: `Value too large: the value must be smaller than ${Number(
            maxValue
          ).toFixed(5)}`,
        })
      )
    }
    setTokenAmount(value)
  }

  return (
    <InputContainer>
      <InputContainerLabel>
        Balance: {token ? logAmount(token.balance, token.decimals, 4) : ''}{' '}
        {token ? token.symbol : ''}
      </InputContainerLabel>
      <InputWithButton
        placeholder={`Amount to bridge to ${layer === LAYER.L1 ? 'L2' : 'L1'}`}
        buttonLabel="max"
        type="number"
        name="bridgeAmount"
        disabled={!token}
        value={tokenAmount}
        onButtonClick={onSetMaxAmount}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          onAmountChange(e.target.value)
        }}
      />
    </InputContainer>
  )
}

export default TokenInput
