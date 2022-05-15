import React from 'react'
import * as S from './MenuItems.styles'

import { useDispatch, useSelector } from 'react-redux'
import { selectModalState } from 'selectors/uiSelector'
import { setPage } from 'actions/uiAction'
import { selectMonster, selectBlockchain } from 'selectors/setupSelector'

function MenuItems ({ setOpen }) {

  const monsterNumber = useSelector(selectMonster())
  const blockchain = useSelector(selectBlockchain())

  let menuItems = [
    {
      key: 'Wallet',
      icon: "WalletIcon",
      title: "Wallet",
      url: "/"
    },
    {
      key: 'History',
      icon: "HistoryIcon",
      title: "History",
      url: "/history"
    }
  ]
  const ethereumAdded = menuItems.some(item => item.key === 'Bridge')
  const monstersAdded = menuItems.some(item => item.key === 'Monster')

  if(!ethereumAdded && blockchain === 'ethereum') {
    menuItems.push({
      key: 'Bridge',
      icon: "WalletIcon",
      title: "Bridge",
      url: "/Bridge"
    })
    menuItems.push({
      key: 'Ecosystem',
      icon: "SafeIcon",
      title: "Ecosystem",
      url: "/Ecosystem"
    })
    menuItems.push({
      key: 'Farm',
      icon: "EarnIcon",
      title: "Earn",
      url: "/earn",
    })
    menuItems.push({
      key: 'Save',
      icon: "SaveIcon",
      title: "Stake",
      url: "/save",
    })
    menuItems.push({
      key: 'DAO',
      icon: "DAOIcon",
      title: "DAO",
      url: "/dao"
    })
  }

  if(monsterNumber > 0 && !monstersAdded && blockchain === 'ethereum') {
    menuItems.push({
      key: 'Monster',
      icon: "MonsterIcon",
      title: "MonsterVerse",
      url: "/"
    })
  } 

  const pageDisplay = useSelector(selectModalState('page'))
  const dispatch = useDispatch()

  return (
    <S.Nav>
      {menuItems.map((item) => {
        const isActive = pageDisplay === item.key
        return (
            <S.MenuItem
              key={item.key}
              onClick={() => {
                if (item.url.startsWith('http')) {
                  window.open(item.url)
                  setOpen(false)
                } else {
                  dispatch(setPage(item.key))
                  setOpen(false)
                }
              }}
              selected={isActive}
            >
              {item.title}
            </S.MenuItem>
        )
      })}
    </S.Nav>
  )
}

export default MenuItems
