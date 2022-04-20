import { styled } from '@mui/material/styles'
import { Box, Typography, Grid, Divider } from "@mui/material"

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

export const DaoWalletHead = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignSelf: 'flex-start',
  justifySelf: 'flex-start',
  alignItems: 'center'
}));

export const DaoWalletPickerContainer = styled(Box)(({theme}) => ({
  width: '100%',
  margin: '10px auto',
  'button' : {
    width: '100%'
  }
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
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '20px 0px',
  'Button': {
    width: '100%'
  }
}));

export const AlertText = styled(Typography)(({ theme }) => ({
  marginLeft: '10px',
  flex: 4,
  [theme.breakpoints.up('md')]: {
  },
}));

export const AlertInfo = styled(Box)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
`;

export const Wrapper = styled(Box)(({ theme, ...props }) => ({
  borderRadius: '8px',
  background: props.dropDownBox ? theme.palette.background.dropdown : theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    padding: ' 30px 10px',
  },
  [theme.breakpoints.up('md')]: {
    padding: '20px',
  },
}));

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
`;

export const DropdownWrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  width: 100%;
  padding: 16px;
  margin-top: 16px;
  background-color: ${props => props.theme.palette.background.secondary};
  border-radius: 12px;
  text-align: left;
`;

export const DropdownContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: '0',
  },
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    gap: '16px',
  },
}));

export const FarmActionContainer = styled(Box)(({theme})=>({
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    width: '100%'
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

export const DividerLine = styled(Divider)(({ theme }) => ({
  background: `${ theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  boxShadow: `${ theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
  width: '100%'
}))

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
