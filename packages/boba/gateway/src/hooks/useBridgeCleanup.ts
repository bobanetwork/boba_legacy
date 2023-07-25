import {
  purgeBridgeAlert,
  resetBridgeAmount,
  resetToken,
} from 'actions/bridgeAction'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectBaseEnabled,
  selectBridgeType,
  selectLayer,
  selectTokenToBridge,
} from 'selectors'

export const useBridgeCleanup = () => {
  const dispatch = useDispatch<any>()

  const activeNetwork = useSelector(selectActiveNetwork())
  const activeNetworkType = useSelector(selectActiveNetworkType())
  const baseEnabled = useSelector(selectBaseEnabled())
  const layer = useSelector(selectLayer())
  const bridgeType = useSelector(selectBridgeType())
  const token = useSelector(selectTokenToBridge())

  useEffect(() => {
    // listen to all change and cleanup bridge token & bridge alert
    dispatch(resetToken())
    dispatch(purgeBridgeAlert())
    dispatch(resetBridgeAmount())
  }, [
    dispatch,
    activeNetwork,
    activeNetworkType,
    baseEnabled,
    layer,
    bridgeType,
  ])

  // on changing token only cleanup alerts
  useEffect(() => {
    dispatch(purgeBridgeAlert())
  }, [dispatch, token])
}

export default useBridgeCleanup
