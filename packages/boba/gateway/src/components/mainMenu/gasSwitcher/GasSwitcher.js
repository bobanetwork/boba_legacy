
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as S from './GasSwitcher.styles'

import { 
  selectGas, 
  selectVerifierStatus, 
  selectBaseEnabled, 
  selectActiveNetwork, 
  selectActiveNetworkName
} from 'selectors'


import { fetchGas } from 'actions/networkAction'
import { fetchVerifierStatus } from 'actions/verifierAction'

import networkService from 'services/networkService'

import useInterval from 'hooks/useInterval'

import { GAS_POLL_INTERVAL } from 'util/constant'
import { NETWORK, NETWORK_TYPE } from 'util/network/network.util'

function GasSwitcher() {
  const dispatch = useDispatch()

  const baseEnabled = useSelector(selectBaseEnabled())
  const gas = useSelector(selectGas)
  const verifierStatus = useSelector(selectVerifierStatus)
  const networkName = useSelector(selectActiveNetworkName())
  const activeNetwork = useSelector(selectActiveNetwork())
  const [ savings, setSavings ] = useState(0)

  // fetch the gas on changing deployment
  useEffect(() => {
    if (baseEnabled) {
      dispatch(fetchGas())
      if(networkService.networkGateway === NETWORK.ETHEREUM) {
        dispatch(fetchVerifierStatus())
      }
    }
  }, [ networkName, baseEnabled , dispatch])

  useInterval(() => {
    if (baseEnabled) {
      dispatch(fetchGas())
      if(networkService.networkGateway === NETWORK.ETHEREUM) {
        dispatch(fetchVerifierStatus())
      }
    }
  }, GAS_POLL_INTERVAL)

  useEffect(() => {
    async function getGasSavings() {
      if (networkService.networkType === NETWORK_TYPE.MAINNET) {
        const l1SecurityFee = await networkService.estimateL1SecurityFee()
        const l2Fee = await networkService.estimateL2Fee()
        // The l1 security fee is moved to the l2 fee
        //const gasSavings = (Number(gas.gasL1) * (l2Fee - l1SecurityFee) / Number(gas.gasL2)) / l2Fee;
        // The l1 security fee is directly deducted from the user's account
        const gasSavings = (Number(gas.gasL1) * l2Fee / Number(gas.gasL2)) / (l2Fee + l1SecurityFee)
        setSavings(gasSavings ? gasSavings : 0)
        return gasSavings
      }
      return 1
    }
    // fetch savings only if network is ethereum and mainnet.
    if (activeNetwork === NETWORK.ETHEREUM) {
      getGasSavings()
    }
  }, [ gas, activeNetwork ])


  return (
    <S.Menu>
      <S.MenuItem>
        <S.Label component="p" variant="body2">{networkName[ 'l1' ]}</S.Label>
        <S.Value component="p" variant="body2">{gas.gasL1} Gwei</S.Value>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label component="p" variant="body2">{networkName[ 'l2' ]}</S.Label>
        <S.Value component="p" variant="body2">{gas.gasL2} Gwei</S.Value>
      </S.MenuItem>
      {
        activeNetwork === NETWORK.ETHEREUM &&
        (<S.MenuItem>
          <S.Label component="p" variant="body2">Savings</S.Label>
          <S.Value component="p" variant="body2">{savings.toFixed(0)}x</S.Value>
        </S.MenuItem>)
      }
      <S.MenuItem>
        <S.Label component="p" variant="body2">L1</S.Label>
        <S.Value component="p" variant="body2">{gas.blockL1}</S.Value>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label component="p" variant="body2">L2</S.Label>
        <S.Value component="p" variant="body2">{gas.blockL2}</S.Value>
      </S.MenuItem>
      {verifierStatus.hasOwnProperty('matchedBlock') &&
        <S.MenuItem>
          <S.Label component="p" variant="body2">Last Verified Block</S.Label>
          <S.Value component="p" variant="body2">{Number(verifierStatus.matchedBlock)}</S.Value>
        </S.MenuItem>
      }
    </S.Menu>
  )

}

export default GasSwitcher
