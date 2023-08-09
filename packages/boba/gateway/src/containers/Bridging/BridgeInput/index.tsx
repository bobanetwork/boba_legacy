import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { openModal } from 'actions/uiAction'
import { selectAccountEnabled, selectTokenToBridge } from 'selectors'

import useBridgeSetup from 'hooks/useBridgeSetup'
import { getCoinImage } from 'util/coinImage'

import useAmountToReceive from 'hooks/useAmountToReceive'
import useBridgeAlerts from 'hooks/useBridgeAlerts'
import BridgeToAddress from './BridgeToAddress'
import Fee from './Fee'
import TokenInput from './TokenInput'
import {
  BridgeInputContainer,
  BridgeInputWrapper,
  DownArrow,
  ReceiveAmount,
  ReceiveContainer,
  TokenLabel,
  TokenPickerIcon,
  TokenSelector,
  TokenSelectorInput,
  TokenSymbol,
} from './styles'
import { SectionLabel } from '../chain/styles'
import bobaLogo from 'assets/images/Boba_Logo_White_Circle.png'

type Props = {}

const BridgeInput: FC<Props> = (props) => {
  const dispatch = useDispatch<any>()
  const isAccountEnabled = useSelector(selectAccountEnabled())
  const token = useSelector(selectTokenToBridge())
  const { amount: recievableAmount } = useAmountToReceive()
  useBridgeSetup()
  useBridgeAlerts()

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
          <SectionLabel>Token</SectionLabel>
          <TokenSelectorInput onClick={() => openTokenPicker()}>
            {token && (
              <TokenSymbol>
                <img
                  src={
                    token.symbol === 'BOBA'
                      ? bobaLogo
                      : getCoinImage(token.symbol)
                  }
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
          <SectionLabel>Receive</SectionLabel>
          <ReceiveAmount>{recievableAmount}</ReceiveAmount>
        </ReceiveContainer>
      )}
      <BridgeToAddress />
      {token && <Fee />}
    </BridgeInputContainer>
  )
}

export default BridgeInput
