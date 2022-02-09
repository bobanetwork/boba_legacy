
import { Box } from '@mui/material'
import { styled } from '@mui/system'

export const Menu = styled('div')({
  display: 'flex',
  width: '100%',
  height: '100px',
  gap: '20px',
  justifyContent: 'flex-start',
  alignItems: 'center',
  paddingTop: '20px',
  paddingLeft: '20px',
  paddingBottom: '20px',
})

export const MobileNavTag = styled(Box)`
  width: 100%;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
`;

export const StyleDrawer = styled(Box)`
  background-color: ${(props) => props.theme.palette.mode === 'light' ? 'white' : '#061122' };
  height: 100%;
`;

export const DrawerHeader = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 40px 40px 20px 40px;
`;

export const WrapperCloseIcon = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
