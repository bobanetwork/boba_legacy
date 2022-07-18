import { Box, Grid } from "@mui/material";
import { styled } from '@mui/material/styles'

export const LockFormContainer = styled(Grid)(({ theme }) => ({
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  display: 'flex',
  flexDirection: 'column',
  width: '100%'
}));

export const LockRecordTitle = styled(Box)(({ theme }) => ({
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary
}))

export const InlineContainer = styled(Box)(({ theme, children, ...props }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  ...props
}))
