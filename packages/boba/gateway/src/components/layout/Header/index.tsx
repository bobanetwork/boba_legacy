import React, { FC } from 'react'
import { HeaderProps } from './types'
import { BobaLogo, HeaderAction, HeaderContainer } from './style'
import { Button } from 'components/global'
import ThemeSwitcher from './ThemeSwitcher'
import Menu from './Menu'
import { useDispatch, useSelector } from 'react-redux'
import { setConnect } from 'actions/setupAction'
import { selectAccountEnabled, selectLayer } from 'selectors'
import { WalletAddress } from './WalletAddress'
import { FeeSwitcher } from 'components/mainMenu'
import { LAYER } from 'util/constant'

export const Header: FC<HeaderProps> = () => {
  const dispatch = useDispatch<any>()
  const layer = useSelector<any>(selectLayer())
  const accountEnabled = useSelector<any>(selectAccountEnabled())

  const onConnect = () => {
    dispatch(setConnect(true))
  }

  return (
    <HeaderContainer>
      <BobaLogo />
      <Menu />
      <HeaderAction>
        {accountEnabled ? (
          <>
            {layer === LAYER.L2 ? <FeeSwitcher /> : null}
            <WalletAddress />
          </>
        ) : (
          <Button onClick={onConnect} small label="Connect Wallet" />
        )}
        <ThemeSwitcher />
      </HeaderAction>
    </HeaderContainer>
  )
}
