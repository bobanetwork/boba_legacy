import { Box, Button as MuiButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ThemeSwitcherTag = styled(Box)(({ theme }) => ({
  display: 'flex',
  position: 'relative',
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
    marginTop: '20px',
    marginLeft: '10px'
  }
}));

export const Button = styled(MuiButton)(({ theme, selected }) => ({
  border: 0,
  padding: '10px',
  borderRadius: '16px',
  backgroundColor: `${selected ? theme.palette.action.disabledBackground : 'transparent'}`,
  cursor: 'pointer',
  transition: 'all .2s ease-in-out',
  zIndex: 5,
}));
