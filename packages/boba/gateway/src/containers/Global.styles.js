import styled from '@emotion/styled'
import { Box, Typography, IconButton, Divider } from '@mui/material'

export const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  margin: '20px auto',
  width: '100%',
  gap: '10px',
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
    overflowX: 'scroll',
    display: 'block'
  },
}))

export const ContentEmpty = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: '400px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '10px',
  height: 'fit-content',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
}))

export const Content = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '10px',
  height: 'fit-content',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  [ theme.breakpoints.down('sm') ]: {
    width: 'fit-content',
    minWidth: '100%'
  },
}))

export const LayerAlert = styled(Box)(({ theme }) => ({
  width: "50%",
  margin: '20px auto',
  gap: '30px',
  paddingLeft: '25px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  [ theme.breakpoints.up('md') ]: {
    width: '100%',
  },
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
  },

}));

export const AlertText = styled(Typography)(({ theme }) => ({
  marginLeft: '10px',
  flex: 4,
  [ theme.breakpoints.up('md') ]: {
  },
}))

export const AlertInfo = styled(Box)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
`;

export const DividerLine = styled(Divider)(({ theme }) => ({
  background: `${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  width: '100%'
}))

export const footerLink = styled(IconButton)(({ theme }) => ({
    svg: {
      path: {
        fill: theme.palette.primary.main,
        fillOpacity: 1,
      }
    }
}))

export const PageSwitcher = styled(Box)(({ theme }) => ({
  width: 'fit-content',
  padding: '3px',
  background: theme.palette.mode === 'light' ? 'rgba(3, 19, 19, 0.04)' : 'rgba(255, 255, 255, 0.04)',
  cursor: 'pointer',
  display: 'flex',
  borderRadius: '12px',
  height: '48px',
  'span': {
    padding: '2px 15px',
    fontWeight: 'bold',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&.active': {
      color: '#031313',
      background: '#BAE21A',
    }
  },
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
    'span': {
      width: '50%'
    }
  },

}));