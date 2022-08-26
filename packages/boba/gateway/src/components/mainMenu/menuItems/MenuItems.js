import React from 'react'
import { menuItems } from '../menuItems'
import { useSelector } from 'react-redux'

import { selectMonster } from 'selectors/setupSelector'
import { useTheme } from '@mui/material'

import * as S from './MenuItems.styles'

const MenuItems = () => {

  const monsterNumber = useSelector(selectMonster())
  const monstersAdded = menuItems.some(item => item.key === 'Monster')

  if (monsterNumber > 0 && !monstersAdded) {
    menuItems.push({
      key: 'Monster',
      icon: "MonsterIcon",
      title: "MonsterVerse",
      url: "/"
    })
  }

  const theme = useTheme()

  return (
    <S.Nav>
      {menuItems.map((item) => {
        if (!+process.env.REACT_APP_ENABLE_LOCK_PAGE && item.key === 'Lock') {
          return null;
        }

        return (
          <S.MenuItem
            style={({ isActive }) => {
              return {
                color: isActive ? theme.palette.secondary.main : 'inherit'
              }
            }}
            key={item.key}
            to={item.url}
          >
            {item.title}
          </S.MenuItem>
        )
      })}
    </S.Nav>
  )
}

export default MenuItems
