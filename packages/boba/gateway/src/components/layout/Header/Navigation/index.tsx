import React, { FC } from 'react'
import { StyledNav, NavLinkItem } from './style'
import { MENU_LIST } from './constant'
import { MenuProps } from './types'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'selectors'
import { NETWORK } from 'util/network/network.util'

/**
 *
 * Below pages will be available for all networks
 *
 * History
 * Ecosystem
 * Bridge
 * Earn
 *
 * Stake / Dao - Only available for eth Boba (Testnet / Mainnet)
 *
 * Filter is not required on menulist as we can force user to
 * connect to boba network on stake & dao page.
 *
 * @param isOpen - is the flag to open and show the menu in case of mobile view.
 *
 *
 * @returns
 */

const Navigation: FC<MenuProps> = ({ isOpen }) => {
  const activeNetwork = useSelector(selectActiveNetwork())

  return (
    <StyledNav>
      {MENU_LIST.map((menu) => {
        if (
          activeNetwork !== NETWORK.ETHEREUM &&
          ['Stake', 'Dao'].includes(menu.label)
        ) {
          return null
        }

        return (
          <NavLinkItem
            key={menu.label}
            to={menu.path}
            className={({ isActive }) => (isActive ? 'active' : '')}
            // onClick={() => isMobile ? setOpen(false) : null}
          >
            {menu.label}
          </NavLinkItem>
        )
      })}
    </StyledNav>
  )
}

export default Navigation
