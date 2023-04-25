import { Typography, Box, BoxProps } from '@mui/material'
import React from 'react'
import * as S from './PageTitle.styles'

interface PageTitleProps {
  title: string
  sx?: BoxProps['sx']
}

const PageTitle = ({ title, sx }: PageTitleProps): JSX.Element => {
  return (
    <Box sx={{ my: 1 }}>
      <S.Wrapper sx={sx}>
        <Typography variant="h1">{title}</Typography>
      </S.Wrapper>
    </Box>
  )
}

export default PageTitle
