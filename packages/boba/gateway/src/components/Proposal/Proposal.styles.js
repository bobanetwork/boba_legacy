import { styled } from '@mui/material/styles'
import { Box, Grid } from '@mui/material'

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  borderBottom: theme.palette.mode === 'light' ? '1px solid #c3c5c7' : '1px solid #192537',
  borderRadius: '12px',
  background: theme.palette.background.secondary,
  marginBottom: '20px',
  [theme.breakpoints.down('md')]: {
    padding: '30px 10px',
  },
  [theme.breakpoints.up('md')]: {
    padding: '20px',
  },
}));

export const GridContainer = styled(Grid)(({theme})=>({
  [theme.breakpoints.down('md')]:{
    justifyContent: 'flex-start'
  }
}))

export const GridItemTag = styled(Grid)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'column', 
  justifyContent: 'center', 
  alignItems:'flex-start', 
  paddingLeft: '8px',
  [theme.breakpoints.down('md')]:{
    padding: `${props.xs === 12 ? '20px 0px 0px': 'inherit'}`
  }
}))

export const GridItemTagR = styled(Grid)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'column', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start', 
  //paddingLeft: '8px',
  [theme.breakpoints.down('md')]:{
    //padding: `${props.xs === 12 ? '20px 0px 0px': 'inherit'}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',  
  }
}))

export const DropdownWrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 6px;
  margin-top: 10px;
  background-color: ${props => props.theme.palette.background.secondary};
  border-radius: 4px;
  text-align: center;
`;

export const DropdownContent = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: '5px',
    padding: '5px'
  },
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    gap: '16px',
  },
}));
