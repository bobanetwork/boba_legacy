import { IconButton } from '@mui/material'
import { Svg } from 'components/global'
import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectModalState } from 'selectors'

import MoonIcon from 'assets/images/theme-moon.svg'
import SunIcon from 'assets/images/theme-sun.svg'
import { setTheme } from 'actions/uiAction'
import { useTheme } from 'styled-components'

enum THEME_NAME {
  LIGHT = 'light',
  DARK = 'dark',
}

const ThemeSwitcher: FC = () => {
  const currentTheme = useSelector(selectModalState('theme'))
  const dispatch = useDispatch<any>()

  const theme: any = useTheme()

  const onThemeChange = (themeName: string) => {
    localStorage.setItem('theme', themeName)
    dispatch(setTheme(themeName))
  }

  return (
    <>
      {currentTheme === THEME_NAME.LIGHT ? (
        <IconButton onClick={() => onThemeChange(THEME_NAME.DARK)}>
          <Svg src={MoonIcon} fill={theme.colors['gray'][600]} />
        </IconButton>
      ) : (
        <IconButton onClick={() => onThemeChange(THEME_NAME.LIGHT)}>
          <Svg src={SunIcon} fill={theme.colors['gray'][100]} />
        </IconButton>
      )}
    </>
  )
}

export default ThemeSwitcher
