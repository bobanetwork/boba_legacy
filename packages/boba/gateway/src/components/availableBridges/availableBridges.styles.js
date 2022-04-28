import { styled } from "@mui/material";
import { Box } from "@mui/system";

export const BridgesContainer = styled(Box)(({ theme }) => ({
  borderRadius: '12px',
  minHeight: '150px'
}));

export const Wrapper = styled(Box)(({ theme }) => ({
  maxHeight: '300px',
  overflowY: 'scroll',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
}));

export const LabelContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-around',
  gap: '10px',
  alignItems: 'center',
  margin: '10px 0px'
}));

export const BridgeContent = styled(Box)(({ theme, border }) => ({
  borderRadius: '12px',
  background: border ? 'linear-gradient(87.16deg, rgba(203, 254, 0, 0.1) 15.05%, rgba(28, 214, 209, 0.1) 79.66%)' :  theme.palette.background.secondaryLight,
  padding: '5px 10px',
  border: border ? '1px solid transparent': 'none'
}));
