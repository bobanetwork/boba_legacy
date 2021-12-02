import React from 'react'
import { Box } from '@material-ui/system'
import { useSelector } from 'react-redux'
import * as S from './NetworkSwitcher.styles.js'

import { selectNetwork } from 'selectors/setupSelector'
import { Typography } from '@material-ui/core'

import NetworkIcon from 'components/icons/NetworkIcon'

function NetworkSwitcher() {

  const masterConfig = useSelector(selectNetwork())

  return (
    <S.WalletPickerContainer>
      <S.WallerPickerWrapper>
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
      </S.WallerPickerWrapper>
    </S.WalletPickerContainer>
  )
};

export default NetworkSwitcher;
