import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const LayerSwitcherContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.palette.background.secondary,
  borderRadius: '12px',
  padding: '0',
  cursor: 'pointer',

}));
