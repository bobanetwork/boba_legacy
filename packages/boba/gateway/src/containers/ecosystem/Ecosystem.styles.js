import { Box } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import { styled } from '@material-ui/core/styles';

export const TileCard = styled(Card)(({ theme, ...props }) => ({
  borderRadius: "10px",
  height: '400px',
  padding: "10px",
  backgroundColor: theme.palette.background.secondary,
  justifyContent: 'space-around'
}))


export const ImageContainer = styled(Box)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-evenly',
  alignItems: 'center',
  minHeight: '300px',
  'img': {
    maxHeight: '260px',
    margin: '10px',
    maxWidth: '160px',
    width: '80%',
    overflow: 'hidden',
  }

}))
