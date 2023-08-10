import React, { useState } from 'react'
import BobaLogo from '../icons/BobaLogo'
import { ReactComponent as BobaLogoM } from 'assets/images/boba2/logo-boba2-m.svg'
import { useSelector } from 'react-redux'
import {
  HeaderWrapper,
  StyleDrawer,
  HeaderActionButton,
  DrawerHeader,
  WrapperCloseIcon,
  HeaderDivider,
} from './PageHeader.styles'
import {
  Box,
  Container,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import NavIcon from 'components/icons/NavIcon'
import WalletIcon from 'components/icons/WalletIcon'
import CloseIcon from 'components/icons/CloseIcon'
import networkService from 'services/networkService'
import { makeStyles } from '@mui/styles'
import {
  Copy,
  Disconnect,
  MenuItems,
  ThemeSwitcher,
  FeeSwitcher,
  NetworkSwitcher,
} from 'components'
import { selectAccountEnabled, selectLayer, selectMonster } from 'selectors'
import { LAYER } from 'util/constant'

const useStyles = makeStyles({
  root: {
    width: '100%',
    color: 'f00',
  },
})

const PageHeader = ({ maintenance }) => {
  const classes = useStyles()
  const [open, setOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [feeOpen, setFeeOpen] = useState(false)

  const theme = useTheme()
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer = useSelector(selectLayer())
  const monsterNumber = useSelector(selectMonster())
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const Logo = monsterNumber > 0 ? BobaLogoM : BobaLogo

  if (maintenance) {
    return (
      <HeaderWrapper>
        <Logo style={{ maxWidth: '140px', paddingTop: '20px' }} />
        <ThemeSwitcher />
      </HeaderWrapper>
    )
  }

  return (
    <>
      {isMobile ? (
        <Container>
          <HeaderWrapper>
            <Logo style={{ maxWidth: '100px', paddingLeft: '20px' }} />
            <HeaderActionButton>
              <Box
                onClick={() => setFeeOpen(!feeOpen)}
                sx={{ cursor: 'pointer' }}
              >
                <Typography component="p" variant="h3" fontWeight={500}>
                  Fee
                </Typography>
              </Box>
              <Box
                onClick={() => setWalletOpen(!walletOpen)}
                sx={{ cursor: 'pointer' }}
              >
                <WalletIcon />
              </Box>
              <Box onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>
                <NavIcon />
              </Box>
            </HeaderActionButton>
            <Drawer
              open={open}
              onClose={() => setOpen(false)}
              classes={{ paper: classes.root }}
            >
              <StyleDrawer theme={theme}>
                <DrawerHeader>
                  <WrapperCloseIcon>
                    <Typography component="p" variant="h1" fontWeight={500}>
                      Menu
                    </Typography>
                    <IconButton size="small" onClick={() => setOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </WrapperCloseIcon>
                </DrawerHeader>
                <HeaderDivider />
                <MenuItems setOpen={setOpen} />
                <ThemeSwitcher />
              </StyleDrawer>
            </Drawer>
            <Drawer
              open={walletOpen}
              onClose={() => setWalletOpen(false)}
              classes={{ paper: classes.root }}
            >
              <StyleDrawer theme={theme}>
                <DrawerHeader>
                  <WrapperCloseIcon>
                    <Typography component="p" variant="h2" fontWeight={500}>
                      Connect wallet
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setWalletOpen(false)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </WrapperCloseIcon>
                </DrawerHeader>
                <HeaderDivider />
                <NetworkSwitcher />
              </StyleDrawer>
            </Drawer>
            <Drawer
              open={feeOpen}
              onClose={() => setFeeOpen(false)}
              classes={{ paper: classes.root }}
            >
              <StyleDrawer theme={theme}>
                <DrawerHeader>
                  <WrapperCloseIcon>
                    <Typography component="p" variant="h1" fontWeight={500}>
                      Select Fee
                    </Typography>
                    <IconButton size="small" onClick={() => setFeeOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </WrapperCloseIcon>
                </DrawerHeader>
                <HeaderDivider />
                {layer === LAYER.L2 ? <FeeSwitcher /> : null}
              </StyleDrawer>
            </Drawer>
          </HeaderWrapper>
        </Container>
      ) : (
        <HeaderWrapper>
          <Logo
            style={{ width: '140px', paddingTop: '', paddingLeft: '15px' }}
          />
          <MenuItems setOpen={setOpen} />
          {layer === LAYER.L2 ? <FeeSwitcher /> : null}
          <NetworkSwitcher />
          {!!accountEnabled ? (
            <>
              <Copy value={networkService.account || ''} />
              <Disconnect />
            </>
          ) : null}
          <ThemeSwitcher />
        </HeaderWrapper>
      )}
    </>
  )
}

export default PageHeader
