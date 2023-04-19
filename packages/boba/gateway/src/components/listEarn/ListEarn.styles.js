import { styled } from '@mui/material/styles'
import { Box } from '@mui/material'

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  cursor:'pointer',
  borderRadius: '0',

  [theme.breakpoints.down('md')]: {
    borderRadius: '20px',
    paddingBottom: '10px'
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
    marginBottom:'20px',
  },
}));