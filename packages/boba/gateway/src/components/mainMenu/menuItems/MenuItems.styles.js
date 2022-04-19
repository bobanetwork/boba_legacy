
import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'

export const Nav = styled('nav')(({ theme }) => ({
  width: '100%',
  height: '25px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    gap: '20px',
    marginTop: '130px',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    backgroundColor: theme.palette.background.default,
    flexDirection: 'column',
  }
}))

export const MenuItem = styled(Box)(({ selected, theme }) => ({
  color: `${ selected ? theme.palette.secondary.main : "inherit"}`,
  fontSize: '0.8em',
  fontWeight: 'normal',
  cursor: 'pointer',
  height: '22px',
  [ theme.breakpoints.down('md') ]: {
    fontSize: '20px',
    fontWeight: '400',
    marginLeft: '20px'
  },
  '&:hover': {
    color: `${theme.palette.secondary.main}`,
  },

}))
