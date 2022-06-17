import { styled, Box } from "@mui/material"

export const BridgeTransferContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}));

export const TokenPicker = styled(Box)(({ theme }) => ({
  background: theme.palette.background.secondary,
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
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
}));
