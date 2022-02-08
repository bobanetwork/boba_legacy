import { Box } from '@mui/material';
import Card from '@mui/material/Card';
import { styled } from '@mui/material/styles';

export const TileCard = styled(Card)(({ theme, ...props }) => ({
  borderRadius: '5px',
  height: '150px',
  width: '150px',
  padding: '5px',
  backgroundColor: theme.palette.background.secondary,
  justifyContent: 'space-between',
  //maxWidth: '90%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  margin: '10px 0',
  border: 'solid rgba(255, 255, 255, 0.27)',
  borderWidth: '1px',
}))

export const TileHeader = styled(Box)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-evenly',
  alignItems: 'center',
}))

export const ImageContainer = styled(Box)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-evenly',
  alignItems: 'center',
  height: '100px',
  'img': {
    width: '70px',
    maxHeight: '90px',
    //margin: '10px',
    //height: '80px',
    //maxWidth: '70%',
    //width: '70%',
    //overflow: 'hidden',
  }

}))

export const TileFooter = styled(Box)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  height: '30px',
  overflow: 'hidden',
}))
