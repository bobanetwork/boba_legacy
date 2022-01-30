
import React, { useEffect, useState } from 'react'

import { Box } from '@material-ui/system'
import { useSelector } from 'react-redux'
import * as S from './GasSwitcher.styles.js'

import { selectGas } from 'selectors/balanceSelector'
import { selectVerifierStatus } from 'selectors/verifierSelector'
import { selectBaseEnabled } from 'selectors/setupSelector'

import { Typography } from '@material-ui/core'

import networkService from 'services/networkService.js'
import { getMaxHealthBlockLag } from 'util/masterConfig'

function GasSwitcher() {

  const baseEnabled = useSelector(selectBaseEnabled())
  const gas = useSelector(selectGas)
  const [savings, setSavings] = useState(0)

  useEffect(() => {
    async function getGasSavings () {
      if (networkService.masterSystemConfig === 'mainnet' || networkService.masterSystemConfig === 'rinkeby') {
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
  }, [gas])

  const verifierStatus = useSelector(selectVerifierStatus)
  let healthStatus = 'healthy'

  if (Number(verifierStatus.matchedBlock) + getMaxHealthBlockLag() < gas.blockL2) {
    healthStatus = 'unhealthy'
  }

  return (
    <S.WalletPickerContainer>
      <S.WalletPickerWrapper>
        <S.Menu>
          <S.NetWorkStyle>
            <S.Label variant="body2">
              Ethereum Gas<br/>
              Boba Gas<br/>
              Savings<br/>
              L1 Block<br/>
              L2 Block<br/>
              Verified to
            </S.Label>
            <Box sx={{
              display: 'flex',
              margin: '10px 0 10px 10px',
              alignItems: 'center',
              gap: 2,
              position: 'relative',
            }}
            >
              {baseEnabled && 
                <Typography
                  variant="body2"
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textTransform: 'capitalize'}}
                >
                  {gas.gasL1} Gwei<br/>
                  {gas.gasL2} Gwei<br/>
                  {savings.toFixed(0)}x<br/>
                  {gas.blockL1}<br/>
                  {gas.blockL2}<br/>
                  {verifierStatus.matchedBlock} {`(${healthStatus})`}
                </Typography>
              }
            </Box>
          </S.NetWorkStyle>
        </S.Menu>
      </S.WalletPickerWrapper>
    </S.WalletPickerContainer>
  )

}

export default GasSwitcher
