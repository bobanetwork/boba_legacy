import { styled } from '@mui/material/styles'
import { Box } from "@mui/material"

export const Wrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: 'center',
  alignItems: 'center',
  margin: '20px 0 40px',
  padding: '0 20px',
  bottom: 0,
  width: '100%',
  [theme.breakpoints.down('md')]: {
    marginTop: 0,
  },
  [theme.breakpoints.up('md')]: {
  },
}))


export const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  [ theme.breakpoints.down('sm') ]: {
    width: '100%'
  }
}))
