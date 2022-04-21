import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const LayerSwitcherWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.palette.background.secondary,
  borderRadius: '12px',
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
