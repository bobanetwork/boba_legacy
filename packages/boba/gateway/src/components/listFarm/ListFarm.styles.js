import { styled } from '@material-ui/core/styles'
import { Box, Grid } from '@material-ui/core';

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  borderBottom: theme.palette.mode === 'light' ? '1px solid #c3c5c7' : '1px solid #192537',
  borderRadius: props.dropDownBox ? '8px' : '0',
  background: props.dropDownBox ? theme.palette.background.dropdown : theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    //padding: '30px 10px',
  },
  [theme.breakpoints.up('md')]: {
    padding: '10px',
  },
}));


export const GridContainer = styled(Grid)(({theme})=>({
  [theme.breakpoints.down('md')]:{
    justifyContent: 'flex-start'
  }
}))


export const GridItemTag = styled(Grid)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: `${!props.isMobile ? 'column' : 'column-reverse'}`,
  alignItems: 'center',
  [theme.breakpoints.down('md')]:{
    padding: `${props.xs === 12 ? '20px 0px 0px': 'inherit'}`
  }
}))

export const DropdownWrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  width: 100%;
  padding: 12px;
  //margin-top: 10px;
  background-color: ${props => props.theme.palette.background.secondary};
  border-radius: 12px;
  text-align: center;
`;

export const DropdownContent = styled(Box)(({ theme }) => ({
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

