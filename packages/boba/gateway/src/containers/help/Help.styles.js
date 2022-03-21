import { Box, Typography } from "@mui/material"
import { styled } from '@mui/material/styles'

export const HelpPageContainer = styled(Box)(({ theme }) => ({
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
  [ theme.breakpoints.up('md') ]: {
    padding: '25px 50px',
  },

}));

export const AlertText = styled(Typography)(({ theme }) => ({
  marginLeft: '10px',
  flex: 4,
}));

export const AlertInfo = styled(Box)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
`;
