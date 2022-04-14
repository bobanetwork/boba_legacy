
import { Typography } from '@mui/material'
import React from 'react'
import * as S from './PageTitle.styles'

const PageTitle = ({ title , sx}) => {

  return (
    <S.Wrapper sx={sx}>
      <Typography variant="h1">{title}</Typography>
    </S.Wrapper>
  )
}

export default PageTitle
