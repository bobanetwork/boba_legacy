import styled from '@emotion/styled'
import { Typography, Box } from '@mui/material'

export const Label = styled(Typography)(({ theme }) => ({
  opacity: '0.85',
  fontSize: '0.8em',
  [ theme.breakpoints.down('md') ]: {
    marginLeft: theme.spacing(1),
  }
}));

export const Value = styled(Typography)(({ theme }) => ({
  opacity: '0.65',
  fontSize: '0.8em',
}));

export const Menu = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: '10px',
  //background: 'green',
  'a': {
    cursor: 'pointer',
  },
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
    flexDirection: 'column'
  }
}))

export const MenuItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  width: '100%',
  gap: '5px',
  'p': {
    whiteSpace: 'nowrap',
  },
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
    justifyContent: 'flex-start',
  }
}))