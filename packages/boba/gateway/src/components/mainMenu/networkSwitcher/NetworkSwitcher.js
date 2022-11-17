import React from 'react'

import { useSelector } from 'react-redux'
import * as S from './NetworkSwitcher.styles.js'

import { selectNetwork } from 'selectors/networkSelector'
import { Box, Typography } from '@mui/material'

import NetworkIcon from 'components/icons/NetworkIcon'

function NetworkSwitcher() {

  const masterConfig = useSelector(selectNetwork())

  return (
    <S.NetworkSwitcherContainer>
      <S.NetworkSwitcherWrapper>
        <S.Menu>
          <S.NetWorkStyle>
            <NetworkIcon />
            <S.Label variant="body2">Network</S.Label>
            <Box sx={{
              display: 'flex',
              margin: '10px 0 10px 15px',
              alignItems: 'center',
              gap: 2,
              position: 'relative',
            }}
            >
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textTransform: 'capitalize'}}>
                {masterConfig}
              </Typography>
            </Box>
          </S.NetWorkStyle>
        </S.Menu>
      </S.NetworkSwitcherWrapper>
    </S.NetworkSwitcherContainer>
  )
};

export default NetworkSwitcher;
