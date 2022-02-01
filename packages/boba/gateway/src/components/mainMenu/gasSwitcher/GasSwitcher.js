
import React, { useEffect, useState } from 'react'

import { useSelector } from 'react-redux'
import * as S from './GasSwitcher.styles.js'

import { selectGas } from 'selectors/balanceSelector'
import { selectVerifierStatus } from 'selectors/verifierSelector'

import { Typography } from '@material-ui/core'

import networkService from 'services/networkService.js'
import { getMaxHealthBlockLag } from 'util/masterConfig'

function GasSwitcher({ isMobile }) {

  const gas = useSelector(selectGas)
  const [ savings, setSavings ] = useState(0)

  useEffect(() => {
    async function getGasSavings() {
      if (networkService.networkGateway === 'mainnet' || networkService.networkGateway === 'rinkeby') {
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
  let healthStatus = 'healthy'

  if (Number(verifierStatus.matchedBlock) + getMaxHealthBlockLag() < gas.blockL2) {
    healthStatus = 'unhealthy'
  }

  return (
    <S.Menu>
      <S.MenuItem>
        <S.Label variant="body2">Ethereum Gas</S.Label>
        <Typography variant="body2">{gas.gasL1} Gwei</Typography>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label variant="body2">Boba Gas</S.Label><Typography variant="body2">{gas.gasL2} Gwei</Typography>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label variant="body2">Savings</S.Label><Typography variant="body2">{savings.toFixed(0)}x</Typography>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label variant="body2">L1 Block</S.Label><Typography variant="body2">{gas.blockL1}</Typography>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label variant="body2">L2 Block</S.Label><Typography variant="body2">{gas.blockL2}</Typography>
      </S.MenuItem>
      <S.MenuItem>
        <S.Label variant="body2">Verified to</S.Label><Typography variant="body2">{verifierStatus.matchedBlock} {`(${healthStatus})`}</Typography>
      </S.MenuItem>
    </S.Menu>
  )

}

export default GasSwitcher
