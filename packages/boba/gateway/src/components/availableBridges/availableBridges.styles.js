import { Box, styled } from "@mui/material"

export const BridgesContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.glassy,
  filter: 'drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06))',
  borderRadius: '20px',
  border: 'none',
  backdropFilter: 'blur(50px)',
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
