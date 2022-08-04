import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';


export const Field = styled(Box)(({ theme }) => ({
  position: 'relative',
  border: `1px solid ${theme.palette.background.secondaryLight}`,
  transition: 'all 200ms ease -in -out',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: '12px',
}))


export const SelectOptionContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.secondary,
  border: '1px solid rgba(255, 255, 255, 0.15)',
  display: 'flex',
  alignItems: 'center'
}));
