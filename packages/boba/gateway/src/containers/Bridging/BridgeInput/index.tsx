import { openModal } from 'actions/uiAction'
import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAccountEnabled,
  selectBridgeType,
  selectLayer,
  selectTokenToBridge,
  selectTokens,
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
import { fetchLookUpPrice } from 'actions/networkAction'
import networkService from 'services/networkService'

type Props = {}

const BridgeInput: FC<Props> = (props) => {
  const dispatch = useDispatch<any>()
  const isAccountEnabled = useSelector(selectAccountEnabled())
  const token = useSelector(selectTokenToBridge())
  const layer = useSelector(selectLayer())
  const bridgeType = useSelector(selectBridgeType())
  const tokenList = useSelector(selectTokens)

  // Fetching lookup price.
  const getLookupPrice = useCallback(() => {
    if (!isAccountEnabled) {
      return
    }
    // TODO: refactor and make sure to triggered this once all the tokens are
    // // only run once all the tokens have been added to the tokenList
    if (Object.keys(tokenList).length < networkService.supportedTokens.length) {
      return
    }
    const symbolList = Object.values(tokenList).map((i: any) => {
      if (i.symbolL1 === 'ETH') {
        return 'ethereum'
      } else if (i.symbolL1 === 'OMG') {
        return 'omg'
      } else if (i.symbolL1 === 'BOBA') {
        return 'boba-network'
      } else if (i.symbolL1 === 'OLO') {
        return 'oolongswap'
      } else {
        return i.symbolL1.toLowerCase()
      }
    })
    dispatch(fetchLookUpPrice(symbolList))
  }, [tokenList, dispatch, isAccountEnabled])

  useEffect(() => {
    if (isAccountEnabled) {
      getLookupPrice()
    }
  }, [getLookupPrice, isAccountEnabled])

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
          meta: 'OMG_INFO',
          type: 'info',
          text: `The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
      In some cases, three interactions with MetaMask are needed. If you are bridging out of a
      new wallet, it starts out with a 0 approval, and therefore, only two interactions with
      MetaMask will be needed.`,
        })
      )
    } else {
      dispatch(
        clearBridgeAlert({
          keys: ['OMG_INFO'],
        })
      )
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
