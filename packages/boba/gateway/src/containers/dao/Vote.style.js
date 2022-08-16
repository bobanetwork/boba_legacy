import { styled } from '@mui/material/styles'
import { Box } from "@mui/material"

export const VotePageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
  paddingTop: '0px',
  gap: '10px'
}));

export const VoteContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'flex-start',
}));

export const VoteContentAction = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
}));

export const NftContainer = styled(Box)(({ theme, active }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  background: active ? theme.palette.background.secondary : theme.palette.background.default,
  borderRadius: theme.palette.primary.borderRadius,
  border: theme.palette.primary.border,
  cursor: 'pointer'
}))

export const Card = styled(Box)(({ theme}) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.palette.background.secondary,
  borderRadius: theme.palette.primary.borderRadius,
  width: '100%',
}))

export const PoolListContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  background: theme.palette.background.secondary,
  borderRadius: theme.palette.primary.borderRadius,
  width: '100%',
}))
