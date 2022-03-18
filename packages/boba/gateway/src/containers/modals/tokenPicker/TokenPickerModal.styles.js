import { Box } from '@mui/material'
import { styled } from '@mui/system'

export const NoContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: '27%'
}))


export const TokenList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}));

export const TokenListItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  cursor: 'pointer'
}));
