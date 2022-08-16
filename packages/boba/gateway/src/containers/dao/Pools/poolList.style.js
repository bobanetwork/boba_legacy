import { styled } from '@mui/material/styles'
import { Box } from "@mui/material"

export const ListItemContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  width: '100%',
  padding: '10px',
  borderBottom: theme.palette.primary.borderBottom
}))
