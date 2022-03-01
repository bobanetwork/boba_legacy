import { styled } from '@mui/material/styles'
import { Box, Grid } from '@mui/material'

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  borderBottom: theme.palette.mode === 'light' ? '1px solid #c3c5c7' : '1px solid #192537',
  borderRadius: '0',
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    //padding: '30px 10px',
  },
  [theme.breakpoints.up('md')]: {
    padding: '10px',
  },
}));

export const Entry = styled(Box)(({ theme }) => ({
  padding: "20px",
  display: "flex",
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.palette.background.secondary,
}))

export const GridContainer = styled(Grid)(({theme})=>({
}))

export const GridItemTag = styled(Grid)(({ theme, ...props }) => ({
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
}))

export const StakeListItemContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '10px 20px'
}));
export const StakeItemDetails = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
}));
export const StakeItemContent = styled(Box)(({ theme }) => ({
  width: '100%',
}));
export const StakeItemAction = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-start',
}));
