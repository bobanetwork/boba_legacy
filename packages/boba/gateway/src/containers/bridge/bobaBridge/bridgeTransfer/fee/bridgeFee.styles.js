import styled from '@emotion/styled';
import { Box } from "@mui/material";

export const BrigeFeeWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
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
