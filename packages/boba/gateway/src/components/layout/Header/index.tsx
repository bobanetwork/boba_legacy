import React, { FC, useState } from 'react'
import { HeaderProps } from './types'
import { BobaLogo, HeaderAction, HeaderContainer, HumberIcon } from './styles'
import { Button } from 'components/global'
import ThemeSwitcher from './ThemeSwitcher'
import Navigation from './Navigation'
import { useDispatch, useSelector } from 'react-redux'
import { setConnect } from 'actions/setupAction'
import { selectAccountEnabled, selectLayer } from 'selectors'
import { WalletAddress } from './WalletAddress'
import { LAYER } from 'util/constant'
import FeeSwitcher from './feeSwitcher'
import NavDrawer from './NavDrawer'

export const Header: FC<HeaderProps> = () => {
  const dispatch = useDispatch<any>()
  const layer = useSelector<any>(selectLayer())
  const accountEnabled = useSelector<any>(selectAccountEnabled())
  const [showDrawer, setShowDrawer] = useState(false)

  const onConnect = () => {
    dispatch(setConnect(true))
  }

  return (
    <HeaderContainer>
      <BobaLogo />
      <Navigation />
      {showDrawer ? <NavDrawer onClose={() => setShowDrawer(false)} /> : null}
      <HeaderAction>
        {accountEnabled ? (
          <>
            {layer === LAYER.L2 ? <FeeSwitcher /> : null}
            <WalletAddress />
          </>
        ) : (
          <Button
            style={{ whiteSpace: 'nowrap' }}
            onClick={onConnect}
            small
            label="Connect Wallet"
          />
        )}
        <HumberIcon onClick={() => setShowDrawer(true)} />
        <ThemeSwitcher />
      </HeaderAction>
    </HeaderContainer>
  )
}
