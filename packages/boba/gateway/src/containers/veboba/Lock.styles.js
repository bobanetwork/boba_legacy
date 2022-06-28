import { Box, Grid } from "@mui/material";
import { styled } from '@mui/material/styles';

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

export const LockFormContainer = styled(Grid)(({ theme }) => ({
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  display: 'flex',
  flexDirection: 'column',
  width: '100%'
}));

export const LockRecordTitle = styled(Box)(({ theme }) => ({
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary
}))
