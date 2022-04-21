import { styled } from '@mui/material/styles'
import { Box, Grid } from "@mui/material"

export const StakePageContainer = styled(Box)(({ theme }) => ({
  margin: '0px auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
  paddingTop: '0px',
  width: '70%',
  [ theme.breakpoints.between('md', 'lg') ]: {
    width: '90%',
    padding: '0px',
  },
  [ theme.breakpoints.between('sm', 'md') ]: {
    width: '90%',
    padding: '0px',
  },
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
  },
}))

export const NFTPageContainer = styled(Box)(({ theme }) => ({
  margin: '20px auto',
  display: 'flex',
  justifyContent: 'space-around',
  width: '100%',
  gap: '10px',
  // [theme.breakpoints.between('md', 'lg')]: {
  //   width: '90%',
  //   padding: '0px',
  // },
  // [theme.breakpoints.between('sm', 'md')]: {
  //   width: '90%',
  //   padding: '0px',
  // },
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
    flexDirection: 'column',
  },
}));

export const NFTActionContent = styled(Box)(({ theme }) => ({
  width: '35%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  gap: '10px',
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
  },
}));

export const NFTFormContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '10px',
  borderRadius: '20px',
  gap: '10px',
  height: 'fit-content',
  background: theme.palette.background.secondary,
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
  },
}));

export const NFTListContainer = styled(Grid)((props) => ({
  width: '63%',
  background: !props['data-empty'] ? props.theme.palette.background.secondary : 'none',
  padding: !props['data-empty'] ? '10px' : 0,
  borderRadius: !props['data-empty'] ? '20px' : 0,
  [ props.theme.breakpoints.down('sm') ]: {
    width: '100%',
  },
}))

export const NFTPageContent = styled(Grid)(({ theme }) => ({
  marginTop: '20px',
  padding: '10px',
  borderRadius: '20px',
  background: theme.palette.background.secondary,
}))
