import styled from '@emotion/styled';
import { Box } from "@mui/material";

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
  },
  [ theme.breakpoints.between('sm', 'md') ]: {
    width: '90%',
    padding: '0px',
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
  alignItems: 'center',
  padding: '30px',
  [ theme.breakpoints.down('sm') ]: {
    padding: '0',
    width: '100%'
  }
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
