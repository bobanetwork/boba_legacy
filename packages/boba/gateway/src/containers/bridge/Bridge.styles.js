import styled from '@emotion/styled'
import { Box } from "@mui/material"
import bobaGlassIcon from 'images/boba2/boba_glass.svg'
import bobaBridgeBg from 'images/boba2/bridge_bg.svg'
export const PageContainer = styled(Box)(({ theme }) => ({
  margin: '20px auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
  width: '70%',
  [ theme.breakpoints.between('md', 'lg') ]: {
    width: '90%',
    padding: '0px',
    '::after': {
      content: '" "',
      position: 'absolute',
      left: '-5%',
      bottom: '10%',
      width: '130%',
      height: '100%',
      background: `url(${bobaBridgeBg}) no-repeat`,
      backgroundSize: '85%',
      zIndex: '-1',
    }
  },
  [ theme.breakpoints.between('sm', 'md') ]: {
    width: '90%',
    padding: '0px',
    '::after': {
      content: '" "',
      position: 'absolute',
      left: '-5%',
      bottom: '10%',
      width: '130%',
      height: '100%',
      background: `url(${bobaBridgeBg}) no-repeat`,
      backgroundSize: '85%',
      zIndex: '-1',
    }
  },
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
  },
}));


export const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  alignItems: 'flex-start',
  gap: '20px',
  [ theme.breakpoints.down('sm') ]: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}))

export const TitleContainer = styled(Box)(({ theme }) => ({
  width: '40%',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: '70px 50px',
  position: 'relative',
  minHeight: '500px',
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
  '::before': {
    content: '" "',
    position: 'absolute',
    top: '5%',
    right: '25%',
    width: '80px',
    height: '80px',
    background: `url(${bobaGlassIcon}) no-repeat`,
    backgroundSize: '100% 90%',
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
