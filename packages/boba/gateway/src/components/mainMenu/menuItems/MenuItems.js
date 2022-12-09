import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTheme } from '@mui/material'

import { selectMonster } from 'selectors/setupSelector'

import { menuItems } from '../menuItems'

import * as S from './MenuItems.styles'

const MenuItems = () => {

  const theme = useTheme()
  const monsterNumber = useSelector(selectMonster())
  const monstersAdded = menuItems.some(item => item.key === 'Monster')
  const [ menuList, setMenuList ] = useState([]);

  useEffect(() => {
    setMenuList(menuItems)
  },[])

  useEffect(() => {
    if (monsterNumber > 0 && !monstersAdded) {
      setMenuList([
        ...menuItems,
        {
          key: 'Monster',
          icon: "MonsterIcon",
          title: "MonsterVerse",
          url: "/monster"
        }
      ])
    }
  }, [ monsterNumber, monstersAdded ]);

  return (
    <S.Nav>
      {menuList.map((item) => {
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
