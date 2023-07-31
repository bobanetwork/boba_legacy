import React from 'react'
import BobaBridge from './bobaBridge/bobaBridge'
import * as S from './Bridge.styles'

function BridgeContainer() {
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
