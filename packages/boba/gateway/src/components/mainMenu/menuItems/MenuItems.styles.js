import { styled } from '@mui/material/styles'
import { NavLink } from 'react-router-dom'
import { Box, Button } from '@mui/material'
import { ReactComponent as BobaIcon } from '../../../images/boba2/boba2Icon.svg'

export const Nav = styled('nav')(({ theme }) => ({
  width: '100%',
  height: '25px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '24px',
  flexWrap: 'wrap',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    gap: '20px',
    height: '250px',
    marginTop: '20px',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    backgroundColor: theme.palette.background.default,
    flexDirection: 'column',
  },
}))

export const MenuListItem = styled(NavLink)(({ theme }) => ({
  fontSize: '0.9em',
  fontWeight: 'normal',
  cursor: 'pointer',
  height: '22px',
  textDecoration: 'none',
  [theme.breakpoints.down('md')]: {
    fontSize: '20px',
    fontWeight: '400',
    marginLeft: '20px',
  },
  color: 'inherit',
  '&:hover': {
    color: `${theme.palette.secondary.main}`,
  },
  '&.active': {
    color: `${theme.palette.secondary.main}`,
  },
}))

export const MenuIcon = styled(BobaIcon)(({ theme }) => ({
  // display: 'none',
  margin: '0 4px -2px 4px',
  '&.active': {
    display: 'inline',
  },
}))
