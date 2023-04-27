import { Typography, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectAccountEnabled } from 'selectors'
import BobaBridge from './bobaBridge/bobaBridge'
import BanxaBridge from './banxaBridge'

import * as S from './Bridge.styles'
import {Tabs} from 'components/global';

function BridgeContainer() {

  const theme = useTheme()
  const accountEnabled = useSelector(selectAccountEnabled())
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const content = [
    {
      title: 'Bridge',
      content: <BobaBridge />
    },
    {
      title: 'Fiat Ramp',
      content: <BanxaBridge/>
    }
  ]
  return (
    <S.PageContainer>
      <S.ContentWrapper>
        
        <S.Content>
        {
          isMobile && accountEnabled ?
            null
            : <S.TitleContainer>
              <Typography variant="h1" sx={{textAlign:"center", textTransform:'capitalize'}}>
                {`Transfer tokens across `}
                <Typography
                  variant="h1"
                  component="span"
                  sx={{
                    background: '-webkit-linear-gradient(0deg, #CBFE00 15.05%, #1CD6D1 79.66%)',
                    'WebkitBackgroundClip': 'text',
                    'WebkitTextFillColor': 'transparent',
                  }}
                >
                   Multichain
                </Typography> layers
              </Typography>
            </S.TitleContainer>
        }

        <Tabs data={content} /> 
          
        </S.Content>
      </S.ContentWrapper>
    </S.PageContainer>
  )
}

export default React.memo(BridgeContainer);
