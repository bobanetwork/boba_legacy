import { styled } from '@mui/material/styles'
import { Box, Typography, Grid } from "@mui/material"

export const EarnPageContainer = styled(Box)(({ theme }) => ({
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
}))

export const Help = styled(Box)(({ theme }) => ({
  width: "100%",
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '30px',
  margin: '10px 0px',
  padding: '10px',
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
}))

export const AlertText = styled(Typography)(({ theme }) => ({
  marginLeft: '10px',
  flex: 4,
  [theme.breakpoints.up('md')]: {
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
  // background: props.dropDownBox ? theme.palette.background.dropdown : theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    padding: ' 30px 10px',
  },
  [theme.breakpoints.up('md')]: {
    padding: '20px',
  },
}))

export const GridItemTagContainer = styled(Grid)(({ theme, ...props }) => ({
  spacing: 2,
  flexDirection: 'row',
  justifyContent: "left",
  alignItems: "center",
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column'
  }
}));

export const GridItemTag = styled(Grid)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap:5px;
`;

export const FarmAction = styled(Box)(({theme})=>({
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    width: '100%'
  }
}))

export const EarnActionContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column'
  }
}))

export const FarmListContainer = styled(Box)(({theme})=>({
  [theme.breakpoints.down('md')]: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  }
}))

export const BpIcon = styled('span')(({ theme }) => ({
  borderRadius: 3,
  width: 16,
  height: 16,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 0 0 1px rgb(16 22 26 / 40%)'
      : 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
  backgroundColor: theme.palette.mode === 'dark' ? '#394b59' : '#f5f8fa',
  backgroundImage:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))'
      : 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
  '.Mui-focusVisible &': {
    outline: '2px auto rgba(19,124,189,.6)',
    outlineOffset: 2,
  },
  'input:hover ~ &': {
    backgroundColor: theme.palette.mode === 'dark' ? '#30404d' : '#ebf1f5',
  },
  'input:disabled ~ &': {
    boxShadow: 'none',
    background:
      theme.palette.mode === 'dark' ? 'rgba(57,75,89,.5)' : 'rgba(206,217,224,.5)',
  },
}))

export const PageSwitcher = styled(Box)(({ theme }) => ({
  width: 'fit-content',
  padding: '3px',
  background: theme.palette.mode === 'light' ? 'rgba(3, 19, 19, 0.04)': 'rgba(255, 255, 255, 0.04)',
  cursor: 'pointer',
  display: 'flex',
  borderRadius: '12px',
  height: '48px',
  'span': {
    padding: '2px 15px',
    fontWeight: 'bold',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&.active': {
      color: '#031313',
      background: '#BAE21A',
    }
  },
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
    'span': {
      width: '50%'
    }
  },

}));
