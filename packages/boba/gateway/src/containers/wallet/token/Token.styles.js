import { Box, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import {Content} from "../../Global.styles";

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
  borderBottom: theme.palette.primary.borderBottom,
  [ theme.breakpoints.down('md') ]: {
    justifyContent: 'flex-start',
    marginBottom: "5px",
    'div:last-child': {
      display: 'none'
     }
  },
}));

export const TableHeadingItem = styled(Typography)(({ theme }) => ({
  width: '20%',
  gap: '5px',
  color: theme.palette.primary.info,
  fontWeight: 'bold',
}));


export const TokenContent = styled(Content)(({ theme }) => ({
  border: 'none !important',
  boxShadow: theme.palette.mode === 'light' ? '0px 4px 20px rgba(35, 92, 41, 0.06)' : 'none',
  borderRadius: '12px !important',
}));
