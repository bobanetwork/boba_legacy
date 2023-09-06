import { setBaseState } from 'actions/setupAction'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectBaseEnabled,
} from 'selectors'
import networkService from 'services/networkService'

export const useOnboard = () => {
  const dispatch = useDispatch<any>()

  const activeNetwork = useSelector(selectActiveNetwork())
  const activeNetworkType = useSelector(selectActiveNetworkType())
  const baseEnabled = useSelector(selectBaseEnabled())

  useEffect(() => {
    window.scrollTo(0, 0)
    const initBase = async () => {
      console.log('init from onBoard')
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

    if (!baseEnabled) {
      initBase()
    }
  }, [dispatch, activeNetwork, activeNetworkType, baseEnabled])
}
