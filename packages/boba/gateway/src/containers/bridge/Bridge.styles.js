import styled from '@emotion/styled'
import {Box, Typography} from "@mui/material"
import bobaGlassIcon from 'images/boba2/boba_glass.svg'
import bobaBridgeBg from 'images/boba2/bridge_bg.svg'
export const PageContainer = styled(Box)(({ theme }) => ({
  margin: '20px auto',
  marginBottom: theme.palette.spacing.toFooter,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
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
  '::after': {
    content: '" "',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `url(${bobaBridgeBg}) no-repeat`,
    backgroundSize: '100%',
    backgroundPosition: 'center',
    left: '0',
    bottom: '0',
    zIndex: '-1',
  },

}));


export const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  alignItems: 'flex-center',
  gap: '20px',
  [ theme.breakpoints.down('sm') ]: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}))

export const TitleContainer = styled(Box)(({ theme }) => ({
  width: '50%',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '70px 50px',
  position: 'relative',
  minHeight: 'auto',
  [ theme.breakpoints.down('sm') ]: {
    padding: '0',
    width: '100%',
    minHeight: 'auto',
    '::after': {
      display: 'none'
    },
    '::before': {
      display: 'none'
    }
  },
  // '::before': {
  //   content: '" "',
  //   position: 'absolute',
  //   top: '20%',
  //   right: '30%',
  //   width: '80px',
  //   height: '80px',
  //   background: `url(${bobaGlassIcon}) no-repeat`,
  //   backgroundSize: '100% 90%',
  // },
}))

export const BobaGlassIcon = styled(Box)(({ theme }) => ({
  content: '" "',
  position: 'absolute',
  top: '15%',
  right: '35%',
  width: '80px',
  height: '80px',
  background: `url(${bobaGlassIcon}) no-repeat`,
  backgroundSize: '100% 90%',
  [theme.breakpoints.down(1700)]: {
    top: '20%',
    right: '40%',
    width: '70px',
    height: '70px',
  },
  [theme.breakpoints.down(1400)]: {
    top: '20%',
    right: '20%',
    width: '70px',
    height: '70px',
  },
  [theme.breakpoints.down(900)]: {
    display: 'none',
  },
}))


export const Content = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: '10px',
  width: '60%',
  padding: '30px 20px',
  flex: 1,
  [ theme.breakpoints.down('sm') ]: {
    padding: '0',
    width: '100%'
  }
}))

export const BridgeTypography = styled(Typography)(({ theme }) => ({
  fontSize: '57px !important',
  [theme.breakpoints.down(1700)]: {
    fontSize: '40px !important',
  },
  [theme.breakpoints.down(1000)]: {
    fontSize: '30px !important',
  },
}))
