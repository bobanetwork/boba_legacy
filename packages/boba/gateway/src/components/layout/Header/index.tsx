import React, { FC } from 'react'
import { HeaderProps } from './types'
import { BobaLogo, HeaderAction, HeaderContainer } from './style'
import { Button } from 'components/global'
import ThemeSwitcher from './ThemeSwitcher'
import Menu from './Menu'

const Header: FC<HeaderProps> = () => {
  return (
    <HeaderContainer>
      <BobaLogo />
      <Menu />
      <HeaderAction>
        <Button small label="Connect Wallet" />
        <ThemeSwitcher />
      </HeaderAction>
    </HeaderContainer>
  )
}

export default Header
