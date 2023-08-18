import React, { FC, useState } from 'react'
import { HeaderProps } from './types'
import {
  BobaLogo,
  HeaderAction,
  HeaderContainer,
  HumberIcon,
  MobileMenuIcon,
} from './styles'
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
import { NetworkSelector } from 'components/NetworkSelector'
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
      <NavDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />
      <HeaderAction>
        {accountEnabled ? (
          <>
            <NetworkSelector />
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
        <MobileMenuIcon>
          <HumberIcon onClick={() => setShowDrawer(true)} />
        </MobileMenuIcon>
        <ThemeSwitcher />
      </HeaderAction>
    </HeaderContainer>
  )
}
