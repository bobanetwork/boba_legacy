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
