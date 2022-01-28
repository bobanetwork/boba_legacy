import { Box } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import { styled } from '@material-ui/core/styles';

export const TileCard = styled(Card)(({ theme, ...props }) => ({
  borderRadius: "10px",
  height: '250px',
  padding: '10px',
  backgroundColor: theme.palette.background.secondary,
  justifyContent: 'space-around',
  maxWidth: '90%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  margin: '10px 0'
  
}))


export const ImageContainer = styled(Box)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-evenly',
  alignItems: 'center',
  minHeight: '140px',
  'img': {
    margin: '10px',
    maxWidth: '160px',
    width: '70%',
    overflow: 'hidden',
  }

}))

export const TileFooter = styled(Box)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-evenly',
  alignItems: 'center',
}))
