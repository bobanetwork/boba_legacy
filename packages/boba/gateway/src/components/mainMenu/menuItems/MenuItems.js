import React from 'react'
import { menuItems } from '../menuItems'
import * as S from './MenuItems.styles'

import { useDispatch, useSelector } from 'react-redux'
import { selectModalState } from 'selectors/uiSelector'
import { setPage } from 'actions/uiAction'

function MenuItems ({ setOpen }) {

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
