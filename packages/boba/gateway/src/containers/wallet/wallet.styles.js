import styled from '@emotion/styled'
import { Box, Typography } from "@mui/material"

export const PageContainer = styled(Box)(({ theme }) => ({
  margin: '0px auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
  paddingTop: '0px',
  width: '70%',
  [ theme.breakpoints.between('md', 'lg') ]: {
    width: '90%',
    padding: '0px',
  },
  [ theme.breakpoints.between('sm', 'md') ]: {
    width: '90%',
    padding: '0px',
  },
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
  },
}));


export const WalletTitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '20px',
  [ theme.breakpoints.down('md') ]: {
    margin: '10px 0px'
  }
}));

export const WalletActionContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: '20px',
  marginBottom: '20px',
  [ theme.breakpoints.down('sm') ]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
}));

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

export const PendingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: '20px',
  [ theme.breakpoints.down('sm') ]: {
    alignItems: 'flex-start',
    margin: '10px 0px'
  },
}))

export const LayerAlert = styled(Box)(({ theme }) => ({
  width: "100%",
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '30px',
  borderRadius: '8px',
  margin: '20px 0px',
  padding: '25px',
  background: theme.palette.background.secondary,
  [ theme.breakpoints.up('md') ]: {
    padding: '25px 50px',
  },

}));

export const AlertText = styled(Typography)(({ theme }) => ({
  marginLeft: '10px',
  flex: 4,
  [ theme.breakpoints.up('md') ]: {
  },
}));

export const AlertInfo = styled(Box)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
`;
