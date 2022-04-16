import { styled } from '@mui/material/styles'
import { Box, Typography } from '@mui/material'

export const Content = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  width: '100%',
  padding: '10px',
  borderBottom: theme.palette.primary.borderBottom
}))

export const TableBody = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  textAlign: 'center',
  [ theme.breakpoints.down('sm') ]: {
    gap: '10px'
  }
}))

export const TableCell = styled(Box)(({ theme, isMobile }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20%',
  [ theme.breakpoints.down('sm') ]: {
    minWidth: '20%',
    width: isMobile ? '10%' : 'unset'
  }
}));

export const TextTableCell = styled(Typography)`
  opacity: ${(props) => !props.enabled ? "0.4" : "1.0"};
  font-weight: 700;
`;

export const DropdownWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  gap: '10px',
  [ theme.breakpoints.down('sm') ]: {
    gap: '5px'
  }
}))
