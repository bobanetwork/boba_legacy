import { setBaseState } from 'actions/setupAction'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectBaseEnabled,
  selectAccountEnabled,
  selectNetworkType,
  selectNetwork,
} from 'selectors'
import networkService from 'services/networkService'

export const useOnboard = () => {
  const dispatch = useDispatch<any>()
  const accountEnabled = useSelector(selectAccountEnabled())
  const activeNetwork = useSelector(selectActiveNetwork())
  const activeNetworkType = useSelector(selectActiveNetworkType())
  const baseEnabled = useSelector(selectBaseEnabled())
  const networkType = useSelector(selectNetworkType())
  const network = useSelector(selectNetwork())

  const initBase = async () => {
    const initialized = await networkService.initializeBase({
      networkGateway: activeNetwork,
      networkType: activeNetworkType,
    })
    if (!initialized) {
      dispatch(setBaseState(false))
    }

    if (initialized === 'enabled') {
      dispatch(setBaseState(true))
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)

    if (!baseEnabled) {
      initBase()
    }
    if (baseEnabled) {
      if (activeNetwork !== network || activeNetworkType !== networkType) {
        initBase()
      }
    }
  }, [dispatch, activeNetwork, activeNetworkType, baseEnabled, accountEnabled])
}
