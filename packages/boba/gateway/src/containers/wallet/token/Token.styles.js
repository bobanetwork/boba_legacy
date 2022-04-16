import { Box, Typography, IconButton } from '@mui/material'
import { styled } from '@mui/material/styles'
import { shadows } from '@mui/system'

export const TokenPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  margin: '20px auto',
  width: '100%',
  gap: '10px',
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
    padding: '0px',
    overflowX: 'scroll',
    display: 'block'
  },
}))

export const TokenPageContentEmpty = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: '400px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '10px',
  height: 'fit-content',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
}))

export const TokenPageContent = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '10px',
  height: 'fit-content',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  [ theme.breakpoints.down('sm') ]: {
    width: 'fit-content',
    minWidth: '100%'
  },
}))

export const LoaderContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
}))

export const TableHeading = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: "10px",
  display: "flex",
  alignItems: "center",
  flexDirection: 'row',
  justifyContent: "space-between",
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  [ theme.breakpoints.down('md') ]: {
    justifyContent: 'flex-start',
    marginBottom: "5px",
    'div:last-child': {
      display: 'none'
     }
  },
}));

export const TableHeadingItem = styled(Typography)`
  width: 20%;
  gap: 5px;
`;

export const LayerAlert = styled(Box)(({ theme }) => ({
  width: "50%",
  margin: '20px auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '30px',
  borderRadius: '12px',
  padding: '25px',
  background: theme.palette.background.secondary,
  [ theme.breakpoints.up('md') ]: {
    width: '100%',
  },
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
  },

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

export const footerLink = styled(IconButton)(({ theme }) => ({
    svg: {
      path: {
        fill: theme.palette.primary.main,
        fillOpacity: 1,
      }
    }
}))
