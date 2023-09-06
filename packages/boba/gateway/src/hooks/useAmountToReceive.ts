import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAmountToBridge,
  selectBridgeType,
  selectL1FeeRateN,
  selectL2FeeRateN,
  selectLayer,
  selectTokenToBridge,
} from 'selectors'
import { toWei_String } from 'util/amountConvert'
import { formatTokenAmount } from 'util/common'
import { LAYER } from 'util/constant'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'

/**
 * This hook is used for getting receivable amount.
 *
 * @returns receivableAmount
 */

export const useAmountToReceive = () => {
  const dispatch = useDispatch<any>()

  const bridgeType = useSelector(selectBridgeType())
  const amount = useSelector(selectAmountToBridge())
  const token = useSelector(selectTokenToBridge())
  const layer = useSelector(selectLayer())
  const l2FeeRateN = useSelector(selectL2FeeRateN)
  const l1FeeRateN = useSelector(selectL1FeeRateN)

  const [amountToReceive, setAmountToReceive] = useState<
    string | null | number
  >(0)

  useEffect(() => {
    if (!token) {
      return
    }

    const formatedAmount = () => {
      return formatTokenAmount({
        ...token,
        balance: toWei_String(Number(amount), token.decimals),
      })
    }

    if (layer === LAYER.L1) {
      if (bridgeType === BRIDGE_TYPE.CLASSIC) {
        setAmountToReceive(formatedAmount())
      } else if (bridgeType === BRIDGE_TYPE.FAST) {
        const value = Number(amount) * ((100 - Number(l2FeeRateN)) / 100)
        setAmountToReceive(value.toFixed(3))
      } else {
        // Teleportation, no fees as of now
        setAmountToReceive(amount)
      }
    } else {
      if (bridgeType === BRIDGE_TYPE.CLASSIC) {
        setAmountToReceive(formatedAmount())
      } else if (bridgeType === BRIDGE_TYPE.FAST) {
        const value = Number(amount) * ((100 - Number(l1FeeRateN)) / 100)
        setAmountToReceive(value.toFixed(3))
      } else {
        // Teleportation, no fees as of now
        setAmountToReceive(amount)
      }
    }
  }, [dispatch, layer, token, amount, bridgeType, l2FeeRateN, l1FeeRateN])

  return {
    amount: `${amountToReceive} ${token?.symbol}`,
  }
}

export default useAmountToReceive
