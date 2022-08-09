import { Box, Grid } from "@mui/material";
import { styled } from '@mui/material/styles';

export const Container = styled(Box)(({ theme }) => ({

}))

export const ThumbnailContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.secondary,
  borderRadius: theme.palette.primary.borderRadius,
  border: '1px solid rgba(255, 255, 255, 0.15)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '4rem',
  width: '4rem',
}))

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
