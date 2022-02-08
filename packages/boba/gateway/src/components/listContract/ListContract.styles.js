import { styled } from '@mui/material/styles'
import { Box, Grid } from '@mui/material'

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  borderBottom: theme.palette.mode === 'light' ? '1px solid #c3c5c7' : '1px solid #192537',
  borderRadius: '0',
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    padding: '10px',
  },
  [theme.breakpoints.up('md')]: {
    padding: '10px',
  },
  marginRight: '40px'
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
