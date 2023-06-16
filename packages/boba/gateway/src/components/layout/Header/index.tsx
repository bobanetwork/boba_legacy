import React, { FC } from 'react'
import { HeaderProps } from './types'
import {
  BobaLogo,
  HeaderAction,
  HeaderContainer,
  HeaderNav,
  NavItem,
} from './style'
import { Button } from 'components/global'
import ThemeSwitcher from './ThemeSwitcher'

const Header: FC<HeaderProps> = () => {
  return (
    <HeaderContainer>
      <BobaLogo />
      <HeaderNav>
        <NavItem variant="body2">Bridge</NavItem>
        <NavItem variant="body2">Ecosystem</NavItem>
        <NavItem variant="body2">History</NavItem>
        <NavItem variant="body2">Earn</NavItem>
        <NavItem variant="body2">Stake</NavItem>
        <NavItem variant="body2">Dao</NavItem>
      </HeaderNav>

      <HeaderAction>
        <Button small label="Connect Wallet" />
        <ThemeSwitcher />
      </HeaderAction>
    </HeaderContainer>
  )
}

export default Header
