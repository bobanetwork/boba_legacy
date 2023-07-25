import React, { useEffect, useState } from 'react'
import { InputContainer, InputContainerLabel } from './index.styles'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectBobaFeeChoice,
  selectBobaPriceRatio,
  selectBridgeType,
  selectClassicExitCost,
  selectExitFee,
  selectFastExitCost,
  selectLayer,
  selectTokenToBridge,
} from 'selectors'
import { logAmount } from 'util/amountConvert'
import InputWithButton from 'components/global/inputWithButton'
import { LAYER } from 'util/constant'
import BN from 'bignumber.js'
import {
  clearBridgeAlert,
  setAmountToBridge,
  setBridgeAlert,
} from 'actions/bridgeAction'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import networkService from 'services/networkService'

interface Props {}

const TokenInput = (props: Props) => {
  const dispatch = useDispatch<any>()
  const layer = useSelector(selectLayer())
  const token = useSelector(selectTokenToBridge())
  const bridgeType = useSelector(selectBridgeType())
  const classicExitCost = useSelector(selectClassicExitCost)
  const fastExitCost = useSelector(selectFastExitCost)
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())
  const exitFee = useSelector(selectExitFee)

  const [tokenAmount, setTokenAmount] = useState('')
  const [maxBalance, setMaxBalance] = useState<any>()

  useEffect(() => {
    // on changing token reset token amount.
    setTokenAmount('')
    dispatch(setAmountToBridge(''))

    if (!token) {
      return
    }

    const balance = Number(logAmount(token.balance, token.decimals))

    if (layer === LAYER.L2) {
      let cost = classicExitCost || 0
      if (bridgeType === BRIDGE_TYPE.FAST) {
        cost = fastExitCost || 0
      }

      const safeCost = Number(cost) * 1.04 // 1.04 == safety margin on cost
      if (token.symbol === networkService.L1NativeTokenSymbol) {
        if (balance - safeCost > 0.0) {
          setMaxBalance(balance - safeCost)
        } else {
          setMaxBalance(0.0)
        }
      } else if (token.symbol === 'BOBA') {
        if (feeUseBoba) {
          if (balance - safeCost * feePriceRatio - exitFee > 0.0) {
            setMaxBalance(balance - safeCost * feePriceRatio - exitFee)
          } else {
            setMaxBalance(0.0)
          }
        } else {
          if (balance - exitFee > 0.0) {
            setMaxBalance(balance - exitFee)
          } else {
            setMaxBalance(0.0)
          }
        }
      } else {
        setMaxBalance(balance)
      }
    } else {
      setMaxBalance(balance)
    }
  }, [token, layer, classicExitCost, feeUseBoba, feePriceRatio, exitFee])

  const onSetMaxAmount = (maxValue: any) => {
    setTokenAmount(maxValue)
    dispatch(setAmountToBridge(maxValue))
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
    dispatch(setAmountToBridge(value))
  }

  return (
    <InputContainer>
      <InputContainerLabel>
        Balance: {maxBalance} {token ? token.symbol : ''}
      </InputContainerLabel>
      <InputWithButton
        placeholder={`Amount to bridge to ${layer === LAYER.L1 ? 'L2' : 'L1'}`}
        buttonLabel="max"
        type="number"
        name="bridgeAmount"
        disabled={!token}
        value={tokenAmount}
        onButtonClick={() => onSetMaxAmount(maxBalance)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          onAmountChange(e.target.value)
        }}
      />
    </InputContainer>
  )
}

export default TokenInput
