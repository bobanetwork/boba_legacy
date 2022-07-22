import { Box } from "@mui/material";
import { styled } from '@mui/material/styles';

export const ThumbnailContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.secondary,
  borderRadius: theme.palette.primary.borderRadius,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '4rem',
  width: '4rem',
}))
