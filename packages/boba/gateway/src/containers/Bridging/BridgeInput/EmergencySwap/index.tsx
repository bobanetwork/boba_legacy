import { Button, Typography } from 'components/global'
import React, { FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAccountEnabled,
  selectActiveNetwork,
  selectLayer,
  selectlayer2Balance,
} from 'selectors'
import networkService from 'services/networkService'
import styled from 'styled-components'
import { LAYER } from 'util/constant'
import { NETWORK } from 'util/network/network.util'
import BN from 'bignumber.js'
import { logAmount } from 'util/amountConvert'
import { isEqual } from 'lodash'
import { openAlert } from 'actions/uiAction'
import { getETHMetaTransaction } from 'actions/setupAction'

export const SwapContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[600] : colors.green[300]};
  background: ${({ theme: { name } }) =>
    name === 'light' ? 'transparant' : 'rgba(238, 238, 238, 0.05)'};
`
export const SwapAlert = styled(Typography).attrs({
  variant: 'body3',
})`
  font-weight: 400;
  line-height: normal;
  color: ${({ theme, color }) =>
    color
      ? color
      : theme.name === 'light'
      ? theme.colors.gray[700]
      : theme.colors.gray[100]};
`
export const SwapAction = styled(Button)`
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-item: center;
  justify-content: center;
`

interface Props {}

const EmergencySwap: FC<Props> = (props) => {
  const network = useSelector(selectActiveNetwork())
  const accountEnabled = useSelector(selectAccountEnabled())
  const l2Balances = useSelector(selectlayer2Balance, isEqual)
  const layer = useSelector(selectLayer())
  const [tooSmallSec, setTooSmallSec] = useState(false)
  const dispatch = useDispatch<any>()

  useEffect(() => {
    if (accountEnabled && l2Balances.length > 0) {
      const l2BalanceSec = l2Balances.find(
        (i: any) => i.symbol === networkService.L1NativeTokenSymbol
      )

      if (l2BalanceSec && l2BalanceSec.balance) {
        // FOR ETH MIN BALANCE 0.003ETH for other secondary tokens 1
        const minBalance = network === NETWORK.ETHEREUM ? 0.003 : 1
        setTooSmallSec(
          new BN(logAmount(l2BalanceSec.balance, 18)).lt(new BN(minBalance))
        )
      } else {
        // in case of zero ETH balance we are setting tooSmallSec
        setTooSmallSec(true)
      }
    }
  }, [l2Balances, accountEnabled, network])

  const emergencySwap = async () => {
    const res = await dispatch(getETHMetaTransaction())
    if (res) {
      dispatch(openAlert('Emergency Swap submitted'))
    }
  }

  const alertContent = () => {
    if (NETWORK.ETHEREUM === network) {
      return `Using BOBA requires a minimum ETH balance (of 0.002 ETH) regardless of your fee setting,
      otherwise MetaMask may incorrectly reject transactions. If you ran out of ETH, use EMERGENCY SWAP to swap BOBA
      for 0.005 ETH at market rates.`
    } else {
      return `Using ${networkService.L1NativeTokenSymbol} requires a minimum BOBA
      balance (of 1 BOBA) regardless of your fee setting, otherwise
      MetaMask may incorrectly reject transactions. If you ran out of
      BOBA, use EMERGENCY SWAP to swap ${networkService.L1NativeTokenSymbol} for 1 BOBA at market rates.`
    }
  }

  if (layer === LAYER.L2 && tooSmallSec) {
    return (
      <SwapContainer>
        <SwapAlert>{alertContent()}</SwapAlert>
        <SwapAction
          small
          outline
          onClick={() => {
            emergencySwap()
          }}
          label="Emergency Swap"
        />
      </SwapContainer>
    )
  } else {
    return null
  }
}

export default EmergencySwap
