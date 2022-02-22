import styled from '@emotion/styled';
import { Box, Divider, Typography } from '@mui/material';

export const LayerSwitcherWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: `${theme.palette.mode === 'light' ? '#FFFFFF' : "rgba(255, 255, 255, 0.06)"}`,
  borderRadius: '12px',
  padding: '0px 10px'
}));

export const LayerContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  flexDirection: 'column',
  marginLeft: '5px',
  [ theme.breakpoints.down('md') ]: {
    flex: 1,
  },
}))

export const Label = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  color: theme.palette.text.disabled,
}));

// Mobile style;
export const LayerSwitcherWrapperMobile = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  padding: '20px',
  gap: '10px'
}));

export const LayerWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  gap: '10px',
  width: '100%'
}));

export const LayerDivider = styled(Divider)(({ theme }) => ({
  background: `${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  boxShadow: `${theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
  width: '100%'
}))

export const LayerSwitcherIconWrapper = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: '12px',
  height: '40px',
  width: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}))

export const LayerSwitcherIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: 'fit-content'
}))
