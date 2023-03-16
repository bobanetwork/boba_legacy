import { Box, Divider, Grid, IconButton, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

export const EcoSystemPageContainer = styled(Box)(({ theme }) => ({
  margin: '0px auto',
  marginBottom: theme.palette.spacing.toFooter,
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

export const CategoryList = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  gap: '10px',
  alignItems: 'center',
  margin: '10px',
  [theme.breakpoints.down('sm')]: {
    overflowX: 'scroll',
  },
}))

export const ProjectListContainer = styled(Grid)(({ theme }) => ({
  margin: '20px 10px !important',
  gap: '22px',
}))

export const ProjectListItem = styled(Grid)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
}))

export const ProjectContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  height: '100%',
}))

export const ProjectContent = styled(Box)(({ theme }) => ({
  borderTopLeftRadius: '12px',
  borderTopRightRadius: '12px',
  background: theme.palette.background.glassy,
  backdropFilter: 'blur(50px)',
  filter: 'drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06))',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  padding: '16px',
  paddingTop: '50px',
  gap: '16px',
  marginTop: '50px',
  width: '100%',
  height: '165px',
  [theme.breakpoints.down('md')]: {
    minHeight: '140px',
    height: 'auto',
  },
}))

export const ImageContainer = styled(Box)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1,
  width: '70px',
  height: '70px',
  borderRadius: '50%',
  position: 'absolute',
  margin: 'auto',
  top: '15px',
  background: theme.palette.mode === 'light' ? '#c7c3c3' : '#272B30',
  img: {
    width: '50px',
    maxHeight: '60px',
    padding: '2px',
  },
}))

export const DividerLine = styled(Divider)(({ theme }) => ({
  background: `${
    theme.palette.mode === 'light'
      ? 'rgba(3, 19, 19, 0.01)'
      : 'rgba(255, 255, 255, 0.04)'
  }`,
  boxSizing: 'border-box',
  width: '100%',
}))

export const ProjectDescription = styled(Typography)(({ theme }) => ({
  width: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  opacity: 0.85,
  fontSize: '13px',
  fontWeight: 400,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  lineHeight: '20px',
  textAlign: 'center',
}))

export const TileFooter = styled(Box)(({ theme, ...props }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  overflow: 'hidden',
  height: '45px',
  width: '100%',
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
  background: theme.palette.background.glassy,
  filter: 'drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06))',
  justifyContent: 'space-around',
  padding: '1rem',
  gap: 1,
}))

export const footerLink = styled(IconButton)(({ theme }) => ({
  svg: {
    path: {
      fill: theme.palette.primary.info,
      fillOpacity: 1,
    },
  },
  '&:hover ': {
    svg: {
      path: {
        fill: theme.palette.secondary.main,
        fillOpacity: 1,
      },
    },
    background: 'none',
  },
}))
