import { Typography, Box } from '@mui/material'
import React from 'react'
import {Wrapper} from './PageTitle.styles'

// interface PageTitleProps {
//   title: string
//   sx?: BoxProps['sx']
// }

const PageTitle = ({ title, sx }) => {
  return (
    <Box sx={{ my: 1 }}>
      <Wrapper>
        <Typography variant="h1">{title}</Typography>
      </Wrapper>
    </Box>
  )
}

export default PageTitle
