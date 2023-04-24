import React, { useState } from 'react'
import * as S from './PageHeader.styles'
import BobaLogo from '../icons/BobaLogo'
import { ReactComponent as BobaLogoM } from '../../images/boba2/logo-boba2-m.svg'

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

type PageHeaderType = {
  maintenance: boolean
}

const PageHeader = ({ maintenance }: PageHeaderType): JSX.Element => {
  const classes = useStyles()
  const [open, setOpen] = useState<boolean>(false)
  const [walletOpen, setWalletOpen] = useState<boolean>(false)
  const [feeOpen, setFeeOpen] = useState<boolean>(false)

  const theme = useTheme()
  const accountEnabled: boolean = useSelector(selectAccountEnabled())
  const layer: 'L1' | 'L2' = useSelector(selectLayer())
  const monsterNumber: number = useSelector(selectMonster())
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const Logo = monsterNumber > 0 ? BobaLogoM : BobaLogo

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
      {isMobile ? (
        <Container>
          <S.HeaderWrapper>
            <Logo style={{ maxWidth: '100px', paddingLeft: '20px' }} />
            <S.HeaderActionButton>
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
            </S.HeaderActionButton>
            <Drawer
              open={open}
              onClose={() => setOpen(false)}
              classes={{ paper: classes.root }}
            >
              <S.StyleDrawer theme={theme}>
                <S.DrawerHeader>
                  <S.WrapperCloseIcon>
                    <Typography component="p" variant="h1" fontWeight={500}>
                      Menu
                    </Typography>
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
            <Drawer
              open={walletOpen}
              onClose={() => setWalletOpen(false)}
              classes={{ paper: classes.root }}
            >
              <S.StyleDrawer theme={theme}>
                <S.DrawerHeader>
                  <S.WrapperCloseIcon>
                    <Typography component="p" variant="h2" fontWeight={500}>
                      Connect wallet
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setWalletOpen(false)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </S.WrapperCloseIcon>
                </S.DrawerHeader>
                <S.HeaderDivider />
                <NetworkSwitcher />
              </S.StyleDrawer>
            </Drawer>
            <Drawer
              open={feeOpen}
              onClose={() => setFeeOpen(false)}
              classes={{ paper: classes.root }}
            >
              <S.StyleDrawer theme={theme}>
                <S.DrawerHeader>
                  <S.WrapperCloseIcon>
                    <Typography component="p" variant="h1" fontWeight={500}>
                      Select Fee
                    </Typography>
                    <IconButton size="small" onClick={() => setFeeOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </S.WrapperCloseIcon>
                </S.DrawerHeader>
                <S.HeaderDivider />
                {layer === LAYER.L2 ? <FeeSwitcher /> : null}
              </S.StyleDrawer>
            </Drawer>
          </S.HeaderWrapper>
        </Container>
      ) : (
        <S.HeaderWrapper>
          <Logo
            style={{ width: '140px', paddingTop: '', paddingLeft: '15px' }}
          />
          <MenuItems setOpen={setOpen} />
          {layer === LAYER.L2 ? <FeeSwitcher /> : null}
          <NetworkSwitcher />
          {!!accountEnabled ? (
            <>
              <Copy value={networkService.account} />
              <Disconnect />
            </>
          ) : null}
          <ThemeSwitcher />
        </S.HeaderWrapper>
      )}
    </>
  )
}

export default PageHeader
