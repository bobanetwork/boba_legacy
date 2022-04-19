import { Box, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

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

export const TableHeadingItem = styled(Typography)`
  width: 20%;
  gap: 5px;
`;
