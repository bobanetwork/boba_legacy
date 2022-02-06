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

