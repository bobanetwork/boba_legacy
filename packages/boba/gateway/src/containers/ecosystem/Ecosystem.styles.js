import { Box, Divider } from '@mui/material';
import Card from '@mui/material/Card';
import { styled } from '@mui/material/styles';

export const EcoSystemPageContainer = styled(Box)(({ theme }) => ({
  margin: '0px auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
  paddingTop: '0px',
  width: '70%',
  [theme.breakpoints.between('md', 'lg')]: {
    width: '90%',
    padding: '0px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    width: '90%',
    padding: '0px',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    padding: '0px',
  },
}))

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

export const DividerLine = styled(Divider)(({ theme }) => ({
  background: `${ theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  boxShadow: `${ theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
  width: '100%'
}))

export const CategoryList = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  gap: '10px',
  alignItems: 'center',
  margin: '10px'
}))
