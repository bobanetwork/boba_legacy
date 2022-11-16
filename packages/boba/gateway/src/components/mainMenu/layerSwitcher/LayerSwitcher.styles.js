import styled from '@emotion/styled';
import { Box, Divider, IconButton, Typography } from '@mui/material';

export const LayerSwitcherWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.palette.background.secondary,
  borderRadius: '12px',
  padding: '0',
  cursor: 'pointer',

}));

export const LayerContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  flexDirection: 'column',
  marginInline: '10px',
  [ theme.breakpoints.down('md') ]: {
    flex: 1,
  },
}))

export const Label = styled(Typography)(({ theme }) => ({
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


export const IconSwitcher = styled(IconButton)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
  border: '1px solid',
  borderColor: `${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0 ,0, 0.06)'}`,
  borderRadius: '12px',
  height: '40px',
  width: '40px'
}))
