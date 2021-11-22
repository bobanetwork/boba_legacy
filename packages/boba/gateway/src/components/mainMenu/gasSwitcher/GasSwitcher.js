import React from 'react'
import { Box } from '@material-ui/system'
import { useSelector } from 'react-redux'
import * as S from './GasSwitcher.styles.js'

import { selectGas } from 'selectors/balanceSelector'
import { Typography } from '@material-ui/core'

function GasSwitcher() {

  const gas = useSelector(selectGas)
  const savings = Number(gas.gasL1) / Number(gas.gasL2)

  return (
    <S.WalletPickerContainer>
      <S.WalletPickerWrapper>
        <S.Menu>
          <S.NetWorkStyle>
            <S.Label variant="body2">
              Ethereum Gas<br/>
              Boba Gas<br/>
              Savings
            </S.Label>
            <Box sx={{
              display: 'flex',
              margin: '10px 0 10px 10px',
              alignItems: 'center',
              gap: 2,
              position: 'relative',
            }}
            >
              <Typography 
                variant="body2" 
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textTransform: 'capitalize'}}
              >
                {gas.gasL1} Gwei<br/>
                {gas.gasL2} Gwei<br/>
                {savings.toFixed(0)}x
              </Typography>
            </Box>
          </S.NetWorkStyle>
        </S.Menu>
      </S.WalletPickerWrapper>
    </S.WalletPickerContainer>
  )
  
}

export default GasSwitcher
