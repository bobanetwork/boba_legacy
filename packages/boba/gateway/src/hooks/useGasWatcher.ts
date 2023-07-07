import { fetchVerifierStatus } from 'actions/verifierAction'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectBaseEnabled,
  selectActiveNetworkName,
  selectActiveNetwork,
  selectActiveNetworkType,
  selectVerifierStatus,
} from 'selectors'
import networkService from 'services/networkService'
import { NETWORK, NETWORK_TYPE } from 'util/network/network.util'
import gasService from 'services/gas.service'
import useInterval from './useInterval'
import { GAS_POLL_INTERVAL } from 'util/constant'

/**
 *
 * useGasWatcher.
 *
 * Gas Calculation
 *
   Fetch gas savings & gas details.
   The l1 security fee is moved to the l2 fee
   const gasSavings = (Number(gas.gasL1) * (l2Fee - l1SecurityFee) / Number(gas.gasL2)) / l2Fee;
   The l1 security fee is directly deducted from the user's account
 *
 * NOTE:TODO: https://github.com/bobanetwork/boba/pull/982#discussion_r1253868688
 */

const useGasWatcher = () => {
  const dispatch = useDispatch<any>()

  const verifierStatus = useSelector(selectVerifierStatus)
  const baseEnabled = useSelector(selectBaseEnabled())
  const [gas, setGas] = useState<any>()
  const networkName = useSelector(selectActiveNetworkName())
  const activeNetwork = useSelector(selectActiveNetwork())
  const activeNetworkType = useSelector(selectActiveNetworkType())

  const [savings, setSavings] = useState<number>(1)

  const fetchGasDetail = useCallback(() => {
    if (baseEnabled) {
      const fetchGas = async () => {
        const gasDetail = await gasService.getGas()
        setGas(gasDetail)
      }

      fetchGas()

      if (activeNetwork === NETWORK.ETHEREUM) {
        dispatch(fetchVerifierStatus())
      }
    }
  }, [networkName, baseEnabled, dispatch])

  useEffect(() => {
    const getGasSavings = async () => {
      const l1SecurityFee = await networkService.estimateL1SecurityFee()
      const l2Fee = await networkService.estimateL2Fee()

      const gasSavings =
        (Number(gas.gasL1) * l2Fee) /
        Number(gas.gasL2) /
        (l2Fee + l1SecurityFee)
      setSavings(gasSavings ? gasSavings : 0)
    }
    // fetch savings only if network is ethereum and mainnet.
    if (
      activeNetwork === NETWORK.ETHEREUM &&
      activeNetworkType === NETWORK_TYPE.MAINNET &&
      gas
    ) {
      getGasSavings()
    }

    fetchGasDetail()
  }, [fetchGasDetail, activeNetwork])

  useInterval(() => {
    fetchGasDetail()
  }, GAS_POLL_INTERVAL)

  return { savings, gas, verifierStatus }
}

export default useGasWatcher
