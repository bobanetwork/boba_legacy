import styled from '@emotion/styled';
import { Box, Typography } from "@mui/material";

export const BrigeFeeWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  margin: '10px 0',
  [ theme.breakpoints.down('sm') ]: {
    flexDirection: 'column',
  }
}));


export const BridgeFeeItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  flexDirection: 'column',
  [ theme.breakpoints.down('sm') ]: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
}));

export const BridgeFeeItemLabel = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  opacity: '0.65'
}));
