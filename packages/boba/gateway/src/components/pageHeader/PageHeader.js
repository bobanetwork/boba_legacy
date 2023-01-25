import React from 'react'
import * as S from './PageHeader.styles'
import { ReactComponent as BobaLogo } from '../../images/boba2/logo-boba2.svg'
import { ReactComponent as BobaLogoM } from '../../images/boba2/logo-boba2-m.svg'
import MenuItems from 'components/mainMenu/menuItems/MenuItems'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import ThemeSwitcher from 'components/mainMenu/themeSwitcher/ThemeSwitcher'
import FeeSwitcher from 'components/mainMenu/feeSwitcher/FeeSwitcher'
import { useState } from 'react'
import { Box, Container, Drawer, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material'
import NavIcon from 'components/icons/NavIcon'
import WalletIcon from 'components/icons/WalletIcon'
import CloseIcon from 'components/icons/CloseIcon'
import networkService from 'services/networkService'
import { makeStyles } from '@mui/styles'
import Copy from 'components/copy/Copy'
import { useSelector } from 'react-redux'
import { selectAccountEnabled, selectLayer, selectMonster } from 'selectors/setupSelector'
import NetworkSwitcher from 'components/mainMenu/networkSwitcher/NetworkSwitcher'
import WalletSwitch from 'components/walletSwitch/WalletSwitch'
import { LAYER } from 'util/constant'

const useStyles = makeStyles({
  root: {
    width: "100%",
    color: "f00",
  },
})

const PageHeader = ({ maintenance }) => {

  const classes = useStyles()
  // eslint-disable-next-line no-unused-vars
  const [ open, setOpen ] = useState()
  const [ walletOpen, setWalletOpen ] = useState()
  const [ feeOpen, setFeeOpen ] = useState()

  const theme = useTheme()
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer = useSelector(selectLayer())
  const monsterNumber = useSelector(selectMonster())
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  let Logo = BobaLogo
  if(monsterNumber>0) Logo = BobaLogoM

  if (maintenance) {
    return (
      <S.HeaderWrapper>
        <Logo style={{ maxWidth: '140px', paddingTop: '20px' }} />
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
              <Logo style={{ maxWidth: '100px', paddingLeft: '20px' }} />
              <S.HeaderActionButton>
                <Box onClick={() => setFeeOpen(!feeOpen)} sx={{ cursor: 'pointer' }}>
                  <Typography component='p' variant="h3" fontWeight={500}>Fee</Typography>
                </Box>
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
                      <Typography component='p' variant="h1" fontWeight={500}>Menu</Typography>
                      <IconButton size="small" onClick={() => setOpen(false)}>
                        <CloseIcon />
                      </IconButton>
                    </S.WrapperCloseIcon>
                  </S.DrawerHeader>
                  <S.HeaderDivider />
                  <MenuItems setOpen={setOpen} />
                  <ThemeSwitcher />
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
              <Drawer open={feeOpen} onClose={() => setFeeOpen(false)} classes={{ paper: classes.root }}>
                <S.StyleDrawer theme={theme}>
                  <S.DrawerHeader>
                    <S.WrapperCloseIcon>
                      <Typography component='p' variant="h1" fontWeight={500}>Select Fee</Typography>
                      <IconButton size="small" onClick={() => setFeeOpen(false)}>
                        <CloseIcon />
                      </IconButton>
                    </S.WrapperCloseIcon>
                  </S.DrawerHeader>
                  <S.HeaderDivider />
                  {layer === LAYER.L2 ? <FeeSwitcher style={{ paddingTop: '15px', marginTop: '20px' }} /> : null}
                </S.StyleDrawer>
              </Drawer>
            </S.HeaderWrapper>
          </Container>
        )
          : (<S.HeaderWrapper>
            <Logo style={{ width: '140px', paddingTop: '15px', paddingLeft: '15px' }} />
            <MenuItems setOpen={setOpen} />
            {layer === LAYER.L2 ? <FeeSwitcher /> : null}
            <WalletSwitch />
            <NetworkSwitcher />
            {!!accountEnabled ? <Copy value={networkService.account} light={false} /> : null}
            <ThemeSwitcher />
          </S.HeaderWrapper>)
      }
    </>
  )
}

export default PageHeader
