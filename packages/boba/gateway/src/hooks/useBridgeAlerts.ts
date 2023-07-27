import {
  clearBridgeAlert,
  purgeBridgeAlert,
  setBridgeAlert,
} from 'actions/bridgeAction'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectBridgeType, selectLayer, selectTokenToBridge } from 'selectors'
import { LAYER } from 'util/constant'

const useBridgeAlerts = () => {
  const dispatch = useDispatch<any>()
  const layer = useSelector(selectLayer())
  const bridgeType = useSelector(selectBridgeType())
  const token = useSelector(selectTokenToBridge())

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

  // on changing bridgeType only cleanup alerts
  useEffect(() => {
    dispatch(purgeBridgeAlert())
  }, [dispatch, bridgeType])
}

export default useBridgeAlerts
