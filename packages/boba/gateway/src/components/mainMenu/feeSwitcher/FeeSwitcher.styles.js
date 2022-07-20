import styled from '@emotion/styled'
import { Box, Typography } from '@mui/material'

export const FeeSwitcherWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  my: 1,
  gap: '5px',
  [ theme.breakpoints.down('md') ]: {
    marginTop: '30px'
  }
}))

export const FeeSwitcherLabel = styled(Typography)(({ theme }) => ({
  whiteSpace: 'nowrap',
  textDecoration: 'underline',
  opacity: 0.65
}))
