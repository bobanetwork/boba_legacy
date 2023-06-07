import { Typography, Box, BoxProps } from '@mui/material'
import React from 'react'
import { Wrapper } from './PageTitle.styles'
interface PageTitleProps {
  title: string
  sx?: BoxProps['sx']
}

const PageTitle = ({ title, sx }: PageTitleProps): JSX.Element => {
  return (
    <Box sx={{ my: 1 }}>
      <Wrapper>
        <Typography variant="h1">{title}</Typography>
      </Wrapper>
    </Box>
  )
}

export default PageTitle
