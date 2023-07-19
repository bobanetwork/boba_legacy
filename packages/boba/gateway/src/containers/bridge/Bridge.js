import { Typography, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectAccountEnabled } from 'selectors'
import BobaBridge from './bobaBridge/bobaBridge'
import * as S from './Bridge.styles'

function BridgeContainer() {

  const theme = useTheme()
  const accountEnabled = useSelector(selectAccountEnabled())
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <S.PageContainer>
      <S.ContentWrapper>
        <S.Content>
          <BobaBridge />
        </S.Content>
      </S.ContentWrapper>
    </S.PageContainer>
  )
}

export default React.memo(BridgeContainer);
