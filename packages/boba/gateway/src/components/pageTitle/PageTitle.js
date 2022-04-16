
import { Typography, Box } from '@mui/material'
import React from 'react'
import * as S from './PageTitle.styles'

const PageTitle = ({ title, sx }) => {

  return (
    <Box sx={{ my: 1 }}>
      <S.Wrapper sx={sx}>
        <Typography variant="h1">{title}</Typography>
      </S.Wrapper>
    </Box>
  )
}

export default PageTitle
