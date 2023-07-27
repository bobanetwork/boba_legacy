import {
  clearBridgeAlert,
  purgeBridgeAlert,
  setBridgeAlert,
} from 'actions/bridgeAction'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAmountToBridge,
  selectBridgeType,
  selectLayer,
  selectTokenToBridge,
} from 'selectors'
import { logAmount } from 'util/amountConvert'
import { LAYER } from 'util/constant'
import BN from 'bignumber.js'

const useBridgeAlerts = () => {
  const dispatch = useDispatch<any>()
  const layer = useSelector(selectLayer())
  const bridgeType = useSelector(selectBridgeType())
  const token = useSelector(selectTokenToBridge())
  const amountToBridge = useSelector(selectAmountToBridge())

  useEffect(() => {
    if (layer === LAYER.L1) {
      if (token && token.symbol === 'OMG') {
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
    }
  }, [dispatch, layer, token, bridgeType])

  useEffect(() => {
    if (!token) {
      return
    }
    const maxValue = logAmount(token.balance, token.decimals)
    const underZero = new BN(amountToBridge).lt(new BN(0.0))
    const overMax = new BN(amountToBridge).gt(new BN(maxValue))

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
  }, [dispatch, token, amountToBridge])

  // on changing bridgeType only cleanup alerts
  useEffect(() => {
    dispatch(purgeBridgeAlert())
  }, [dispatch, bridgeType])
}

export default useBridgeAlerts
