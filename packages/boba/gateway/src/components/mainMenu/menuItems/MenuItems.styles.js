import { Box } from '@material-ui/core'
import { styled } from '@material-ui/core/styles'

export const Nav = styled('nav')(({ theme }) => ({
  width: '400px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start', 
  alignItems: 'center', 
  gap: '10px',
  flexWrap: 'wrap',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    paddingLeft: '30px',
    backgroundColor: theme.palette.background.default,
  },
  [theme.breakpoints.up('md')]: {
    //paddingTop: '30px',
    //display: 'flex',
    //flexDirection: 'row',
  },
}))

export const MenuItem = styled(Box)`
  color: ${props => props.selected ? props.theme.palette.secondary.main : "inherit"};
  font-size: 0.8em;
  font-weight: ${props => props.selected ? 700 : 'normal'};
  cursor: pointer;
`

