import { styled } from '@mui/material/styles'
import { Box, Typography, Grid, Divider } from "@mui/material"
import stakeBg from 'images/boba2/stake-balance-bg.png'

export const StakePageContainer = styled(Box)(({ theme }) => ({
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

export const StakeEarnContainer = styled(Box)(({ theme }) => ({
  borderRadius: '20px',
  padding: '24px',
  minHeight: '150px',
  marginBottom: '10px',
  width: '100%',
  backdropFilter: 'blur(10px)',
  background: `url(${stakeBg})  ${theme.palette.mode === 'light' ? 'rgba(3, 19, 19, 0.04)' : 'rgba(255, 255, 255, 0.04)'} no-repeat`,
  backgroundPosition: '100% 0%',
  backgroundSize: '40%'
}))

export const StakeInputContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'light' ? '#F5F6F6' : 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  padding: '32px 24px',
  minHeight: '150px',
  gap: '10px',
  display: 'flex',
  flexDirection: 'column',
  width: '100%'
}))

export const StakeHeadContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'light' ? '#F5F6F6' : 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  padding: '10px 20px',
  width: '100%',
  marginBottom: '10px'
}))

export const StakeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.palette.mode === 'light' ? '#F5F6F6' : 'rgba(255, 255, 255, 0.04)',
  //backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  padding: '24px',
  minHeight: '400px',
  width: '100%',
}))

export const StakeItemContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'light' ? '#F5F6F6' : 'rgba(255, 255, 255, 0.04)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  //backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  width: '100%'
}))

export const StakeItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}))

export const DividerLine = styled(Divider)(({ theme }) => ({
  background: `${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  //boxShadow: `${theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
  width: '100%'
}))

export const TableHeading = styled(Box)(({ theme }) => ({
  padding: "20px",
  borderTopLeftRadius: "6px",
  borderTopRightRadius: "6px",
  display: "flex",
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.palette.background.secondary,
  // [theme.breakpoints.down('md')]: {
  //   marginBottom: "5px",
  // },
}))

export const LayerAlert = styled(Box)(({ theme }) => ({
  width: "100%",
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexDirection: 'column',
  gap: '10px',
  borderRadius: '8px',
  margin: '20px 0px',
  padding: '20px',
  background: theme.palette.background.secondary,
}))

export const AlertText = styled(Typography)(({ theme }) => ({
  marginLeft: '10px',
  flex: 4,
  [ theme.breakpoints.up('md') ]: {
  },
}))

export const AlertInfo = styled(Box)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
`;

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  borderRadius: '8px',
  background: theme.palette.background.secondary,
  [ theme.breakpoints.down('md') ]: {
    padding: ' 30px 10px',
  },
  [ theme.breakpoints.up('md') ]: {
    padding: '20px',
  },
}));

export const GridItemTag = styled(Grid)`
  text-align: left;
`;

export const ListContainer = styled(Box)(({ theme }) => ({
  [ theme.breakpoints.down('md') ]: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  }
}))
