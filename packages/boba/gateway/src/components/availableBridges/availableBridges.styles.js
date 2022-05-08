import { Box, styled } from "@mui/material"

export const BridgesContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.secondary,
  borderRadius: theme.palette.primary.borderRadius,
  border: theme.palette.primary.border,
  backdropFilter: 'blur(100px)',
  flex: 1,
  minHeight: 'fit-content',
  padding: '20px',
  width: '100%',
}))

export const Wrapper = styled(Box)(({ theme }) => ({
  maxHeight: '300px',
  overflowY: 'scroll',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
}))

export const LabelContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-around',
  gap: '10px',
  alignItems: 'center',
  margin: '10px 0px'
}))

export const BridgeContent = styled(Box)(({ theme, border }) => ({
  borderRadius: theme.palette.primary.borderRadius,
  background: theme.palette.background.secondaryLight,
  padding: '5px 10px',
  border: theme.palette.primary.border,
}))
