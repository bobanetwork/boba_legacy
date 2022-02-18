import styled from '@emotion/styled';
import {Box} from '@material-ui/core';

export const Tabs = styled(Box)(({theme})=>({
   display: 'flex',
   flexDirection: 'row',
   justifyContent: 'flex-start',
   flex: 1,
   marginBottom: '20px',
   [theme.breakpoints.down('md')]:{
      width: '100%'
   }
}));


export const TabItem = styled(Box)(({ theme }) => ({
   opacity: 0.7,
   transition: 'color 200ms ease-in-out',
   cursor: 'pointer',
   marginRight: '20px',
   '&:hover': {
      opacity: 1,
   },
   '&.active': {
      color: `${theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.neutral.main}`,
      opacity: 1,
      borderBottom: `2px solid ${theme.palette.neutral.contrastText}`,
      marginBottom: '-2px',
      zIndex: 1,
   },
   [theme.breakpoints.down('md')]: {
      flex: 1,
      textAlign: 'center'
   }
}))


