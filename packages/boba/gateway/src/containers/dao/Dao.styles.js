import { styled } from '@mui/material/styles'
import { Box } from "@mui/material"

export const DaoPageContainer = styled(Box)(({ theme }) => ({
  margin: '0px auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
  paddingTop: '0px',
  width: '70%',
  [theme.breakpoints.between('md', 'lg')]: {
    width: '90%',
    padding: '0px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    width: '90%',
    padding: '0px',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    padding: '0px',
  },

}));

export const DaoPageContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '0px',
  gap: '10px',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  },
}));

export const DaoWalletContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '0px 20px',
  minHeight: '700px',
  width: '30%',
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

export const DaoWalletAction = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  width: '100%',
  margin: '10px auto',
  gap: '10px',
}));

export const DaoProposalContainer = styled(Box)(({ theme }) => ({
  width: '70%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '0 32px',
  minHeight: '500px',
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    padding: '0 20px',
  },
}));

export const DaoProposalHead = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  justifyContent: 'space-between',
  padding: '24px 0px',
  width: '100%',
  margin: '5px',
  [theme.breakpoints.down('sm')]: {
    padding: '0px',
  },
}))

export const DaoProposalListContainer = styled(Box)(({ theme }) => ({
  overflowY: 'auto',
  margin: '10px auto',
  borderRadius: '8px',
  padding: '20px 10px',
  width: '100%',
  height: '600px',
  '.loadingContainer' : {
    padding: '10px auto',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '0px',
  },
}))
