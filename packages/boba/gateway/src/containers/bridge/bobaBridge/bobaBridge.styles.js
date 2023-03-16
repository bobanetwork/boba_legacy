import styled from '@emotion/styled'
import {
  Box,
  Button,
  Divider as MuiDivider,
  IconButton,
  Typography,
} from '@mui/material'

export const BobaBridgeWrapper = styled(Box)(({ theme, width }) => ({
  background: theme.palette.background.glassy,
  backdropFilter: 'blur(50px)',
  borderRadius: '20px',
  filter: 'drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06))',
  flex: 1,
  minHeight: 'fit-content',
  padding: '24px',
  width: '100%',
  maxWidth: '600px',
}))

export const BobaContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
}))

export const BridgeConnectButton = styled(Box)(({theme})=> ({
  alignSelf: 'flex-start',
  [ theme.breakpoints.down('md') ]: {
    alignSelf: 'stretch',
    'button': {
      width: '100%'
    }
  }
}));

export const BobaContentWrapper = styled(Box, {
  shouldForwardProp: (props) => props !== 'fullWidth',
})(({ theme, flexDirection }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  flexDirection: flexDirection || 'column',
  flexGrow: 1,
}))

export const BobaDivider = styled(MuiDivider)(({ theme }) => ({
  background: theme.palette.background.secondary,
  boxSizing: 'border-box',
  width: '100%',
  margin: '16px 0 16px 0',
}))

export const ChainInput = styled(Box)(({ theme }) => ({
  background: theme.palette.background.input,
  border: theme.palette.secondary.border,
  boxSizing: 'border-box',
  borderRadius: theme.palette.primary.borderRadius,
  height: '50px',
  padding: '5px 10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  minWidth: '180px',
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'flex-start',
    gap: '5px',
    padding: '5px 10px',
    minWidth: '120px',
  },
}))

export const ChainLabel = styled(Typography)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  [theme.breakpoints.down('sm')]: {
    fontSize: '14px',
  },
}))

export const ChainSwitcherIcon = styled(Button)(({ theme }) => ({
  margin: '20px 0px',
  width: 'fit-content',
  alignSelf: 'center',
}))

export const HistoryLink = styled(Box)(({ theme, width }) => ({
  background: theme.palette.background.glassy,
  backdropFilter: 'blur(50px)',
  filter: 'drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06))',
  border: 'none',
  borderRadius: theme.palette.primary.borderRadius,
  width: '100%',
  maxWidth: '600px',
  padding: '20px',
  '&:hover > span': {
    color: theme.palette.secondary.main,
  },
}))

export const LayerAlert = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '30px',
  borderRadius: theme.palette.primary.borderRadius,
  margin: '20px 0px',
  padding: '25px',
  [theme.breakpoints.up('md')]: {
    padding: '25px 50px',
  },
}))

export const AlertText = styled(Typography)(({ theme }) => ({
  marginLeft: '10px',
  flex: 4,
  [theme.breakpoints.up('md')]: {},
}))

export const AlertInfo = styled(Box)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
`

export const IconSwitcher = styled(IconButton)(({ theme }) => ({
  background: theme.palette.background.input,
  borderRadius: theme.palette.primary.borderRadius,
  height: '40px',
  width: '40px',
  display: 'flex',
  alignSelf: 'center',
  justifyContent: 'center',
  alignItems: 'center',
}))

export const ChainDirectionLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.tooltip,
}))
