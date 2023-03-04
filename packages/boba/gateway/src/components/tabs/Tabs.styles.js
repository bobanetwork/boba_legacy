import styled from '@emotion/styled'
import { Box } from '@mui/material'

export const Tabs = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  flex: 1,
  marginBottom: '20px',
  borderBottom: theme.palette.primary.borderBottom,
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
}))

export const TabItem = styled(Box)(({ theme }) => ({
  opacity: 0.7,
  transition: 'color 200ms ease-in-out',
  cursor: 'pointer',
  marginRight: '20px',
  textTransform: 'capitalize',
  '&:hover': {
    opacity: 1,
  },
  '&.active': {
    color: `${
      theme.palette.mode === 'light'
        ? theme.palette.primary.main
        : theme.palette.neutral.main
    }`,
    opacity: 1,
    borderBottom: theme.palette.primary.tabBorderBottom,
    marginBottom: '-2px',
    zIndex: 1,
    borderImage: 'linear-gradient(87.16deg, #CBFE00 15.05%, #1CD6D1 79.66%);',
    borderImageSlice: 1,
  },
  [theme.breakpoints.down('md')]: {
    flex: 1,
    textAlign: 'center',
  },
}))
