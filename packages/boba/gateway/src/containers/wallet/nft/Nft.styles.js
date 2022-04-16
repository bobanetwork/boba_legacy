import { styled } from '@mui/material/styles'
import { Box, Grid } from "@mui/material"

export const NFTActionContent = styled(Box)(({ theme }) => ({
  width: '35%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  gap: '10px',
  border: theme.palette.primary.border,
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondary,
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
  },
}));

export const NFTFormContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '10px',
  gap: '10px',
  height: 'fit-content',
  [ theme.breakpoints.down('sm') ]: {
    width: '100%',
  },
}))

export const NFTListContainer = styled(Grid)((props) => ({
  width: '63%',
  border: props.theme.palette.primary.border,
  background: !props['data-empty'] ? props.theme.palette.background.secondary : 'none',
  padding: !props['data-empty'] ? '10px' : 0,
  borderRadius: !props['data-empty'] ? props.theme.palette.primary.borderRadius : 0,
  [ props.theme.breakpoints.down('sm') ]: {
    width: '100%',
  },
}))


