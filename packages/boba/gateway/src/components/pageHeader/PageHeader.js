import React from 'react'
import * as S from './PageHeader.styles'
import { ReactComponent as BobaLogo } from '../../images/boba2/logo-boba2.svg'
import MenuItems from 'components/mainMenu/menuItems/MenuItems'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import ThemeSwitcher from 'components/mainMenu/themeSwitcher/ThemeSwitcher'
import { useState } from 'react'
import { Box, Container, Drawer, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material'
import NavIcon from 'components/icons/NavIcon'
import WalletIcon from 'components/icons/WalletIcon'
import CloseIcon from 'components/icons/CloseIcon'
import networkService from 'services/networkService';
import { makeStyles } from '@mui/styles'
import Copy from 'components/copy/Copy'
import { useSelector } from 'react-redux'
import { selectAccountEnabled } from 'selectors/setupSelector'

const useStyles = makeStyles({
  root: {
    width: "100%",
    color: "f00",
  },
})

const PageHeader = ({ maintenance }) => {

  const classes = useStyles()
  // eslint-disable-next-line no-unused-vars
  const [ open, setOpen ] = useState();
  const [ walletOpen, setWalletOpen ] = useState();
  const theme = useTheme()
  const accountEnabled = useSelector(selectAccountEnabled())
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (maintenance) {
    return (
      <S.HeaderWrapper>
        <BobaLogo style={{ maxWidth: '140px', paddingTop: '20px' }} />
        <ThemeSwitcher />
      </S.HeaderWrapper>
    )
  }

  return (
    <>
      {
        isMobile ? (
          <Container>
            <S.HeaderWrapper>
              <BobaLogo style={{ maxWidth: '100px', paddingLeft: '20px' }} />
              <S.HeaderActionButton>
                <Box onClick={() => setWalletOpen(!walletOpen)} sx={{ cursor: 'pointer' }}>
                  <WalletIcon />
                </Box>
                <Box onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>
                  <NavIcon />
                </Box>
              </S.HeaderActionButton>
              <Drawer open={open} onClose={() => setOpen(false)} classes={{ paper: classes.root }}>
                <S.StyleDrawer theme={theme}>
                  <S.DrawerHeader>
                    <S.WrapperCloseIcon>
                      <Typography component='p' variant="h2" fontWeight={500}>Menu</Typography>
                      <IconButton size="small" onClick={() => setOpen(false)}>
                        <CloseIcon />
                      </IconButton>
                    </S.WrapperCloseIcon>
                  </S.DrawerHeader>
                  <MenuItems setOpen={setOpen} />
                </S.StyleDrawer>
              </Drawer>
              <Drawer open={walletOpen} onClose={() => setWalletOpen(false)} classes={{ paper: classes.root }}>
                <S.StyleDrawer theme={theme}>
                  <S.DrawerHeader>
                    <S.WrapperCloseIcon>
                      <Typography component='p' variant="h2" fontWeight={500}>Connect wallet</Typography>
                      <IconButton size="small" onClick={() => setWalletOpen(false)}>
                        <CloseIcon />
                      </IconButton>
                    </S.WrapperCloseIcon>
                  </S.DrawerHeader>
                  <S.HeaderDivider />
                  <LayerSwitcher />
                </S.StyleDrawer>
              </Drawer>
            </S.HeaderWrapper>
          </Container>
        ) : (<S.HeaderWrapper>
          <BobaLogo style={{ width: '140px', paddingTop: '15px', paddingLeft: '15px'}} />
          <MenuItems setOpen={setOpen} />
          <LayerSwitcher />
          {!!accountEnabled ? <Copy value={networkService.account} light={false} /> : null}
          <ThemeSwitcher />
        </S.HeaderWrapper>)
      }
    </>
  )
}

export default PageHeader
