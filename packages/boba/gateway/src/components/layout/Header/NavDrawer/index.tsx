import { Drawer } from '@mui/material'
import { makeStyles } from '@mui/styles'
import SunIcon from 'assets/images/theme-sun.svg'
import { Svg, SwitchButton } from 'components/global'
import React, { FC, useState } from 'react'
import { useTheme } from 'styled-components'
import { MENU_LIST } from '../Navigation/constant'
import { BobaLogo } from '../styles'
import {
  ActionContainer,
  ActionIcon,
  ActionItem,
  ActionLabel,
  ActionValue,
  CloseIcon,
  DrawerHeader,
  HeaderDivider,
  NavLinkItem,
  NavList,
  StyleDrawer,
  ThemeIcon,
  WrapperCloseIcon,
} from './styles'
import useThemeSwitcher from 'hooks/useThemeSwitcher'
import { THEME_NAME } from '../types'
import { getCoinImage } from 'util/coinImage'
import truncateMiddle from 'truncate-middle'
import networkService from 'services/networkService'
import { useSelector } from 'react-redux'
import { selectAccountEnabled, selectLayer } from 'selectors'
import AccountDrawer from './AccountDrawer'
import FeeSwitcherDrawer from './FeeSwitcherDrawer'

interface Props {
  onClose: () => void
  open: boolean
}

const useStyles = makeStyles({
  root: {
    width: '100%',
    color: 'f00',
    borderRadius: '0px',
  },
})

const NavDrawer: FC<Props> = ({ onClose, open }) => {
  const classes = (useStyles as any)()
  const { currentTheme, setThemeDark, setThemeLight } = useThemeSwitcher()
  const theme: any = useTheme()
  const [userDrawer, setUserDrawer] = useState<boolean>(false)
  const [feeSwitcherDrawer, setFeeSwitcherDrawer] = useState<boolean>(false)

  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())

  return (
    <Drawer open={open} classes={{ paper: classes.root }}>
      <StyleDrawer>
        <DrawerHeader>
          <BobaLogo />
          <WrapperCloseIcon>
            <CloseIcon onClick={onClose} />
          </WrapperCloseIcon>
        </DrawerHeader>
        <HeaderDivider />
        <ActionContainer>
          <ActionItem>
            <ActionIcon />
            <ActionLabel>Account</ActionLabel>
            <ActionValue onClick={() => setUserDrawer(true)}>
              {truncateMiddle(networkService.account as string, 5, 5, '...')}
            </ActionValue>
          </ActionItem>
          {!!accountEnabled && layer === 'L2' ? (
            <ActionItem>
              <ThemeIcon>
                <img src={getCoinImage('ETH')} alt="use token" />
              </ThemeIcon>
              <ActionLabel>Gas Fee</ActionLabel>
              <ActionValue onClick={() => setFeeSwitcherDrawer(true)}>
                ETH
              </ActionValue>
            </ActionItem>
          ) : null}
          <ActionItem>
            <ThemeIcon>
              <Svg src={SunIcon} fill={theme.colors['gray'][600]} />
            </ThemeIcon>
            <ActionLabel>Light Mode</ActionLabel>
            <SwitchButton
              isActive={currentTheme === THEME_NAME.DARK}
              onStateChange={(d: any) => {
                if (d) {
                  setThemeDark()
                } else {
                  setThemeLight()
                }
              }}
            />
          </ActionItem>
        </ActionContainer>
        <HeaderDivider />
        <NavList>
          {MENU_LIST.map((menu) => {
            return (
              <NavLinkItem
                key={menu.label}
                to={menu.path}
                activeclassname="active"
                onClick={onClose}
              >
                {menu.label}
              </NavLinkItem>
            )
          })}
        </NavList>
        <AccountDrawer
          onCloseNav={onClose}
          open={userDrawer}
          onClose={() => {
            setUserDrawer(false)
          }}
        />
        <FeeSwitcherDrawer
          onCloseNav={onClose}
          open={feeSwitcherDrawer}
          onClose={() => {
            setFeeSwitcherDrawer(false)
          }}
        />
      </StyleDrawer>
    </Drawer>
  )
}

export default NavDrawer
