import styled from '@emotion/styled';
import {Box} from '@mui/material';

export const LayerSwitcherContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '12px',
  padding: '0',
  cursor: 'pointer',
  [ theme.breakpoints.up('sm') ]: {
    background: theme.palette.background.glassy,
  }
}));
