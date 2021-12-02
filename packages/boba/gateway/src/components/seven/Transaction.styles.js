import styled from '@emotion/styled';
import { Box, Grid } from '@material-ui/core'

export const DropdownWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  gap: 10px;
`;

export const TableCell = styled(Box)`
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  word-break: break-all
`;

export const TableBody = styled(Box)`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 5px;
  text-align: left;
`;

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  borderBottom: theme.palette.mode === 'light' ? '1px solid #c3c5c7' : '1px solid #192537',
  borderRadius: '0',
  //background: theme.palette.background.secondary,
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
  alignItems: 'center',
  [theme.breakpoints.down('md')]:{
    padding: `${props.xs === 12 ? '20px 0px 0px': 'inherit'}`
  }
}))
