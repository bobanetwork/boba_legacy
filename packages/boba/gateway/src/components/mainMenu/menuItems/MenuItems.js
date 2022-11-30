import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTheme } from '@mui/material'
import { intersection } from 'lodash'
import { selectMonster } from 'selectors/setupSelector'
import { pagesByChain, MENU_LIST } from './menu.config'

import * as S from './MenuItems.styles'
import { DISABLE_VE_DAO } from 'util/constant'
import { selectActiveNetwork } from 'selectors/networkSelector'

const MenuItems = () => {

  const theme = useTheme()
  const monsterNumber = useSelector(selectMonster())
  const menuList = MENU_LIST;
  const monstersAdded = MENU_LIST.some(item => item.key === 'Monster')
  const [ list, setList ] = useState([]);
  const network = useSelector(selectActiveNetwork());

  useEffect(() => {
    const filterMenu = menuList.filter((m) => intersection([ m.key ], pagesByChain[ network.toLowerCase() ]).length)

    setList(filterMenu);
  },[network, menuList])

  useEffect(() => {
    if (monsterNumber > 0 && !monstersAdded) {
      setList([
        ...list,
        {
          key: 'Monster',
          icon: "MonsterIcon",
          title: "MonsterVerse",
          url: "/monster"
        }
      ])
    }
  }, [ monsterNumber, monstersAdded, list ]);

  return (
    <S.Nav>
      {list.map((item) => {
        if (!!Number(DISABLE_VE_DAO) && (['Lock','Vote&Dao'].includes(item.key))) {
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
