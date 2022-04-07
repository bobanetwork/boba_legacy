import React, { useState } from 'react'

import { ReactComponent as Logo } from './../../images/logo-boba.svg'
import { ReactComponent as BobaLogo } from '../../images/boba2/logo-boba2.svg'
import { ReactComponent as CloseIcon } from './../../images/icons/close-modal.svg'
import * as S from "./MainMenu.styles"

import { Link } from 'react-router-dom'

import NetworkSwitcher from './networkSwitcher/NetworkSwitcher'
import LayerSwitcher from './layerSwitcher/LayerSwitcher'
import FeeSwitcher from './feeSwitcher/FeeSwitcher'
import MenuItems from './menuItems/MenuItems'

import { useTheme } from '@emotion/react'
import { Box, Container, Drawer, IconButton, useMediaQuery } from '@mui/material'

import WalletAddress from 'components/walletAddress/WalletAddress'

import { makeStyles } from '@mui/styles'

import NavIcon from '../icons/NavIcon'
import WalletPicker from 'components/walletpicker/WalletPicker'

const useStyles = makeStyles({
  root: {
    width: "100%",
    color: "f00",
  },
})

function MainMenu({ pageDisplay, handleSetPage, onEnable, enabled }) {

  const [ open, setOpen ] = useState(false)
  const classes = useStyles()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <>
      {isMobile ? (
        <Container>
          <S.MobileNavTag>
            <Box onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>
              <NavIcon />
            </Box>
            <Drawer open={open} onClose={() => setOpen(false)} classes={{ paper: classes.root }}>
              <S.StyleDrawer theme={theme}>
                <S.DrawerHeader>
                  <S.WrapperCloseIcon>
                    <Link to="/" style={{ display: "flex" }}>
                      <Logo width={150} />
                    </Link>
                    <IconButton size="small" onClick={() => setOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </S.WrapperCloseIcon>
                  <NetworkSwitcher />
                  <LayerSwitcher />
                  <FeeSwitcher />
                  <WalletPicker />
                </S.DrawerHeader>
                <MenuItems setOpen={setOpen} />
              </S.StyleDrawer>
            </Drawer>
            <WalletAddress />
          </S.MobileNavTag>
        </Container>
      ) : (
        <S.Menu>
          <BobaLogo style={{maxWidth: '140px'}}/>
          <MenuItems setOpen={setOpen} />
        </S.Menu>
      )}
    </>
  );
}

export default MainMenu
