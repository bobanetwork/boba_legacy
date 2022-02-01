import React from 'react'
import GasSwitcher from '../mainMenu/gasSwitcher/GasSwitcher'
import * as S from './PageFooter.styles'

const PageFooter = () => {
  return (
    <S.Wrapper>
      <S.ContentWrapper>
        <GasSwitcher />
      </S.ContentWrapper>
    </S.Wrapper>
  )
}

export default PageFooter
