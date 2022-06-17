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
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
    flexDirection: 'column',
  },
}));

export const NFTActionContent = styled(Box)(({ theme }) => ({
  width: '45%',
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
  gap: '10px',
  height: 'fit-content',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
  },
}));

export const NFTListContainer = styled(Grid)(({ theme }) => ({
  width: '63%',
  padding: '10px',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
  },
}))

export const NFTPageContent = styled(Grid)(({ theme }) => ({
  marginTop: '20px',
  padding: '10px',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
}))
