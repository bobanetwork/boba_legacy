import React from 'react'
import { Box, Typography, useMediaQuery } from '@material-ui/core'
import { useTheme } from '@material-ui/core/styles'
import GasSwitcher from '../mainMenu/gasSwitcher/GasSwitcher'
import * as S from './PageFooter.styles'

const PageFooter = ({ title }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  return (
    <S.Wrapper>
      <GasSwitcher />
    </S.Wrapper>
  )
}

export default PageFooter
