import { Box, Divider } from "@mui/material"
import { styled } from '@mui/material/styles'

export const HeaderWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '64px',
  gap: '10px',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '20px',
  [ theme.breakpoints.down('md') ]: {
    justifyContent: 'space-between',
    padding: '20px 0',
  }
}))

export const HeaderActionButton = styled(Box)(({ theme }) => ({
  gap: '10px',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
}))

export const DrawerHeader = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 20px 24px;
`;

export const HeaderDivider = styled(Divider)(({ theme }) => ({
  background: `${ theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  boxShadow: `${ theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
  width: '100%'
}))

export const WrapperCloseIcon = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const StyleDrawer = styled(Box)`
  background-color: ${(props) => props.theme.palette.mode === 'light' ? 'white' : '#111315'};
  height: 100%;
`;
