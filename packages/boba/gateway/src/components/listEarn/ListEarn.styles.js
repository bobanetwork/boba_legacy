import { styled } from '@mui/material/styles'
import { Box } from '@mui/material'

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  cursor:'pointer',
  borderBottom: theme.palette.mode === 'light' ? '1px solid #c3c5c7' : '1px solid #1a1c1e',
  borderRadius: '0',
  background: theme.palette.background.glassy,
  
  [theme.breakpoints.down('md')]: {
    //padding: '30px 10px',
    background: '#1A1D1F',
    borderRadius: '20px',
    padding: '10px 20px',
  },
  [theme.breakpoints.up('md')]: {
    padding: '10px',
  },
}));


export const DropdownWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '5px',
  width: '100%',
  padding: '10px 15px',
  marginTop: '10px',
  borderRadius: '10px',
  textAlign: 'center',
  backgroundColor: theme.palette.background.glassy
}));

export const DropdownContent = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-start',
  borderRadius: '20px',
  margin: '5px',
  padding: '10px 10px 0px 10px',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: '5px',
    padding: '5px',
    width: '100%',
    margin: '10px 0 0 0',
  },
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    gap: '30px',
  },
}));
