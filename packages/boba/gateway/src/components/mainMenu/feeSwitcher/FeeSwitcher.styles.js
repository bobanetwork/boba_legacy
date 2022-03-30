import styled from '@emotion/styled'
import { Box } from '@mui/material'

export const FeeSwitcherWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  background: `${theme.palette.mode === 'light' ? '#FFFFFF' : "rgba(255, 255, 255, 0.06)"}`,
  borderRadius: '12px',
  padding: '0px 10px'
}))

export const FeeSwitcherLeft = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  padding: '0px 10px'
}))

export const FeeSwitcherRight = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  marginLeft: '5px',
  [ theme.breakpoints.down('md') ]: {
    flex: 1,
  },
}))


