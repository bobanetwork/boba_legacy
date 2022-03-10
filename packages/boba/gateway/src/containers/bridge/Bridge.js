import { Typography } from '@mui/material';
import React from 'react'
import BobaBridge from './bobaBridge/bobaBridge';
import * as S from './Bridge.styles'


function BridgeContainer() {

  return (
    <S.PageContainer>
      <S.ContentWrapper>
        <S.TitleContainer>
          <Typography variant="h1"
          > Transfer 
            <br/>
            tokens between Ethereum and
            <br/>
            <Typography
              variant="h1"
              component="span"
              sx={{
                background: '-webkit-linear-gradient(269deg, #CBFE00 15.05%, #1CD6D1 79.66%)',
                '-webkit-background-clip': 'text',
                '-webkit-text-fill-color': 'transparent'
              }}
            >
              Boba network!
            </Typography>
          </Typography>
        </S.TitleContainer>
        <BobaBridge />
      </S.ContentWrapper>
    </S.PageContainer>
  )
}


export default React.memo(BridgeContainer);
