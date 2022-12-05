import { styled } from '@mui/material/styles'
import { NavLink } from 'react-router-dom'

export const Nav = styled('nav')(({ theme }) => ({
  width: '100%',
  height: '25px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
    gap: '20px',
    height: '250px',
    marginTop: '20px',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    backgroundColor: theme.palette.background.default,
    flexDirection: 'column',
  }
}))

export const MenuListItem = styled(NavLink)(({ theme }) => ({
  fontSize: '0.8em',
  fontWeight: 'normal',
  cursor: 'pointer',
  height: '22px',
  textDecoration: 'none',
  [ theme.breakpoints.down('md') ]: {
    fontSize: '20px',
    fontWeight: '400',
    marginLeft: '20px'
  },
  color: 'inherit',
  '&:hover': {
    color: `${theme.palette.secondary.main}`,
  },
  '&.active': {
    color: `${theme.palette.secondary.main}`,
  },
}))
