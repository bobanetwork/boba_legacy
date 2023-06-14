import React, { FC } from 'react'
import { HeaderProps } from './types'
import { BobaLogo, HeaderContainer, NavItem } from './style'

const Header: FC<HeaderProps> = () => {
  return (
    <HeaderContainer>
      <BobaLogo />
      <div>
        <NavItem variant="body2">Bridge</NavItem>
        <NavItem variant="body2">Ecosystem</NavItem>
        <NavItem variant="body2">History</NavItem>
        <NavItem variant="body2">Earn</NavItem>
        <NavItem variant="body2">Stake</NavItem>
        <NavItem variant="body2">Dao</NavItem>
      </div>
    </HeaderContainer>
  )
}

export default Header
