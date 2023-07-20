import { openModal } from 'actions/uiAction'
import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAccountEnabled,
  selectBridgeType,
  selectLayer,
  selectTokenToBridge,
} from 'selectors'

import { getCoinImage } from 'util/coinImage'
import { Label } from '../styles'
import BridgeToAddress from './BridgeToAddress'
import Fee from './Fee'
import {
  DownArrow,
  ReceiveAmount,
  ReceiveContainer,
  BridgeInputContainer,
  BridgeInputWrapper,
  TokenLabel,
  TokenPickerIcon,
  TokenSelector,
  TokenSelectorInput,
  TokenSelectorLabel,
  TokenSymbol,
} from './styles'

import { LAYER } from 'util/constant'
import { BRIDGE_TYPE } from '../BridgeTypeSelector'
import { clearBridgeAlert, setBridgeAlert } from 'actions/bridgeAction'
import TokenInput from './TokenInput'
import { formatTokenAmount } from 'util/common'

type Props = {}

const BridgeInput: FC<Props> = (props) => {
  const dispatch = useDispatch<any>()
  const isAccountEnabled = useSelector(selectAccountEnabled())
  const token = useSelector(selectTokenToBridge())
  const layer = useSelector(selectLayer())
  const bridgeType = useSelector(selectBridgeType())

  // TODO: Move to specific hook add specificity on trigering this hook.
  useEffect(() => {
    if (
      bridgeType === BRIDGE_TYPE.CLASSIC &&
      token &&
      token.symbol === 'OMG' &&
      layer === LAYER.L1
    ) {
      dispatch(
        setBridgeAlert({
          meta: token.symbol,
          type: 'info',
          text: `The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
      In some cases, three interactions with MetaMask are needed. If you are bridging out of a
      new wallet, it starts out with a 0 approval, and therefore, only two interactions with
      MetaMask will be needed.`,
        })
      )
    } else {
      dispatch(clearBridgeAlert())
    }
  }, [dispatch, bridgeType, token, layer])

  const openTokenPicker = () => {
    dispatch(openModal('tokenPicker'))
  }

  if (!isAccountEnabled) {
    return null
  }

  return (
    <BridgeInputContainer>
      <BridgeInputWrapper>
        <TokenSelector>
          <TokenSelectorLabel>Amount</TokenSelectorLabel>
          <TokenSelectorInput onClick={() => openTokenPicker()}>
            {token && (
              <TokenSymbol>
                <img
                  src={getCoinImage(token.symbol)}
                  alt={`ETH logo`}
                  width="32px"
                  height="32px"
                />
              </TokenSymbol>
            )}
            <TokenLabel>{token ? token?.symbol : 'Select'}</TokenLabel>
            <TokenPickerIcon>
              <DownArrow />
            </TokenPickerIcon>
          </TokenSelectorInput>
        </TokenSelector>
        <TokenInput />
      </BridgeInputWrapper>
      {token && (
        <ReceiveContainer>
          <Label>Receive</Label>
          <ReceiveAmount>
            {formatTokenAmount(token)} {token.symbol}
          </ReceiveAmount>
        </ReceiveContainer>
      )}
      <BridgeToAddress />
      {token && <Fee />}
    </BridgeInputContainer>
  )
}

export default BridgeInput
