import styled from '@emotion/styled';
import { MenuItem } from '@mui/material';


export const ChainSwitcherItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  cursor: 'pointer',
  '&:hover': {
    p: {
      color: '#BAE21A'
    }
  }
}));


