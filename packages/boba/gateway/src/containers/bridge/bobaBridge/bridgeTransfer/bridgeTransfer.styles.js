import { styled } from "@mui/material";
import { Box } from "@mui/system";


export const BridgeTransferContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}));

export const TokenPicker = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '12px',
  height: '50px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '2px',
  padding: '5px 10px',
  width: '100%',
  cursor: 'pointer',
  'img': {
    marginRight: '5px'
  },
  [ theme.breakpoints.down('sm') ] : {
    borderRadius: '12px 0 0 12px',
    width: '40%',
  }
}));
