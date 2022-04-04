
import React, { useEffect, useState } from 'react'

import { useSelector } from 'react-redux'
import * as S from './GasSwitcher.styles.js'

import { selectGas } from 'selectors/balanceSelector'
import { selectVerifierStatus } from 'selectors/verifierSelector'

import networkService from 'services/networkService.js'

function GasSwitcher({ isMobile }) {

  const gas = useSelector(selectGas)
  const [ savings, setSavings ] = useState(0)

  useEffect(() => {
    async function getGasSavings() {
      if (networkService.networkGateway === 'mainnet') {
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
    getGasSavings()
  }, [ gas ])

  const verifierStatus = useSelector(selectVerifierStatus)

  return (
    <S.Menu>
      <S.MenuItem>
        <S.Label component="p" variant="body2">Ethereum</S.Label>
        <S.Value component="p" variant="body2">{gas.gasL1} Gwei</S.Value>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label component="p" variant="body2">Boba</S.Label>
        <S.Value component="p" variant="body2">{gas.gasL2} Gwei</S.Value>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label component="p" variant="body2">Savings</S.Label>
        <S.Value component="p" variant="body2">{savings.toFixed(0)}x</S.Value>
      </S.MenuItem>
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
