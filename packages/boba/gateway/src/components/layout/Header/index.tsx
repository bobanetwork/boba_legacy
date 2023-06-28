import React, { FC } from 'react'
import { HeaderProps } from './types'
import { BobaLogo, HeaderAction, HeaderContainer } from './style'
import { Button } from 'components/global'
import ThemeSwitcher from './ThemeSwitcher'
import Menu from './Menu'
import { useDispatch, useSelector } from 'react-redux'
import { setConnect } from 'actions/setupAction'
import { selectAccountEnabled } from 'selectors'
import { WalletAddress } from './WalletAddress'

export const Header: FC<HeaderProps> = () => {
  const dispatch = useDispatch<any>()
  const accountEnabled = useSelector<any>(selectAccountEnabled())

  const onConnect = () => {
    console.log('triggering dispatch')
    dispatch(setConnect(true))
  }

  return (
    <HeaderContainer>
      <BobaLogo />
      <Menu />
      <HeaderAction>
        {accountEnabled ? (
          <WalletAddress />
        ) : (
          <Button onClick={onConnect} small label="Connect Wallet" />
        )}
        <ThemeSwitcher />
      </HeaderAction>
    </HeaderContainer>
  )
}
