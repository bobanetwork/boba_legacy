import { styled } from '@mui/material/styles'
import { Box, Divider } from '@mui/material'

export const Wrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  //margin: '0',
  //padding: '0 20px',
  //bottom: 0,
  //width: '100%',
  //height: '184px',
  background: theme.background,
  [ theme.breakpoints.down('md') ]: {
    marginTop: 0,
    height: '450px',
    justifyContent: 'flex-start',
    padding: '0 20px',
  },
  [ theme.breakpoints.up('md') ]: {
  },
}))

export const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  width: '70%',
  margin: '30px 0',
  [ theme.breakpoints.between('sm', 'md') ]: {
    width: '90%',
    margin: '20px 0',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '20px'
  },
  [ theme.breakpoints.down('md') ]: {
    margin: '20px 0',
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '20px'
  }
}))

export const FooterLink = styled(Box)(({ theme }) => ({
  //marginLeft: theme.spacing(1),
  marginTop: theme.spacing(1),
  fontSize: '14px',
  textDecoration: 'none',
  cursor: 'pointer',
  color: 'unset',
  '&:hover': {
    color: theme.palette.secondary.main,
  },
}));

export const FooterLogoWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignSelf: 'flex-start',
  justifyContent: "center",
  alignItems: 'center'
}))

export const FooterDivider = styled(Divider)(({ theme }) => ({
  background: `${ theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  boxShadow: `${ theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
  width: '100%'
}))

export const FooterDividerMobile = styled(Divider)(({ theme }) => ({
  display: 'none',
  [ theme.breakpoints.down('md') ]: {
    display: 'block',
    background: `${ theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
    boxSizing: 'border-box',
    boxShadow: `${ theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
    width: '100%'
  }
}))

export const FooterLinkWrapperLeft = styled(Box)(({ theme }) => ({
}))

export const FooterLinkWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignSelf: 'flex-start',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '70%',
  margin: '20px auto',
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
    justifyContent: 'space-around',
    flexDirection: 'column',
    margin: '0',
    alignItems: 'flex-start',
  }
}))

export const LinkWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '40%',
  justifyContent: 'flex-start',
  gap: '10px',
  [ theme.breakpoints.down('md') ]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    margin: '20px 0',
  },
  [ theme.breakpoints.down('sm') ]: {
    width: '100%'
  }
}))

export const SocialWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '20%',
  justifyContent: 'flex-end',
  gap: '10px',
  'a': {
    cursor: 'pointer',
  },
  [ theme.breakpoints.down('md') ]: {
    justifyContent: 'flex-start',
    margin: '10px 0',
  },
  [ theme.breakpoints.down('sm') ]: {
    width: '100%'
  }
}))
