import styled from '@emotion/styled'
import { Box } from '@mui/material'

export const HistoryContainer = styled.div`
  background: ${props => props.theme.palette.background.secondary};
  border-radius: 8px;
  margin-bottom: 20px;
`;

export const HistoryPageContainer = styled(Box)(({ theme }) => ({
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
}))

export const Disclaimer = styled.div`
  margin: 5px 10px;
  margin-top: 20px;
`;

export const Content = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
  padding: 10px 20px;
  border-radius: 6px;
`;

export const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
  },
}))

export const TableHeading = styled(Box)(({ theme }) => ({
  padding: "20px",
  borderTopLeftRadius: "6px",
  borderTopRightRadius: "6px",
  display: "flex",
  alignItems: "center",
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    marginBottom: "5px",
  },
}))

export const LayerAlert = styled(Box)(({ theme }) => ({
  width: "100%",
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '30px',
  borderRadius: '8px',
  margin: '20px 0px',
  padding: '25px',
  background: theme.palette.background.secondary,
  [theme.breakpoints.up('md')]: {
    padding: '25px 50px',
  },

}));
