import { Grid } from '@material-ui/core'
import { styled } from '@material-ui/core/styles'

export const GridItem = styled(Grid)(({ theme, ...props }) => ({
  borderRadius: "10px",
  '> div': {
    height: '400px',
    padding: "10px",
    backgroundColor: theme.palette.background.secondary,
    justifyContent: 'space-around'
  }
}))
