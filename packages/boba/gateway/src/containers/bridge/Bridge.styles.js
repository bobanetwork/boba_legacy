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
}))

export const TitleContainer = styled(Box)(({ theme }) => ({
  width: '40%',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '30px'
}))

export const Content = styled(Box)(({ theme }) => ({

}))


