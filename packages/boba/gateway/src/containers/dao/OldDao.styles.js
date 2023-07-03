import { styled } from '@mui/material/styles'
import { Box } from "@mui/material"

export const DaoPageContainer = styled(Box)(({ theme }) => ({
  margin: '0px auto',
  marginBottom: theme.palette.spacing.toFooter,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
  paddingTop: '0px',
  width: '70%',
  gap: '10px',
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
  gap: '10px 35px',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  },
}));

export const DaoWalletContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '0px 20px',
  width: '30%',
  minWidth: '330px',
  gap: '10px',
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.glassy,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

export const VerticalDivisor =  styled(Box)(({ theme }) => ({
  width:'1px',
  background:"rgba(84, 84, 84, 1)",
  height:'47px',
  margin:'0px 50px'
}));

export const DaoProposalContainer = styled(Box)(({ theme }) => ({
  width: '70%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '0',
  minHeight: '500px',
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
  padding: '15px 0px',
  width: '100%',
  margin: '5px',
  [theme.breakpoints.down('sm')]: {
    padding: '0px',
  },
}))

export const DaoProposalListContainer = styled(Box)(({ theme }) => ({
  display:'flex',
  flexDirection:'column',
  margin: '10px auto',
  borderRadius: '8px',
  padding: '20px 0px 20px 0px',
  width: '100%',
  gap:'10px 0px',
  '.loadingContainer' : {
    padding: '10px auto',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '0px',
  },
}))

export const DaoWalletAction = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  width: '100%',
}));
