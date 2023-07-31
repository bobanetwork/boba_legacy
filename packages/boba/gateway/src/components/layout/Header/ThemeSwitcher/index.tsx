import { Svg } from 'components/global'
import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectModalState } from 'selectors'

import { setTheme } from 'actions/uiAction'
import MoonIcon from 'assets/images/theme-moon.svg'
import SunIcon from 'assets/images/theme-sun.svg'
import { useTheme } from 'styled-components'
import { THEME_NAME } from '../types'
import { IconWrapper } from './styles'

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
        <IconWrapper
          title="dark-icon"
          onClick={() => onThemeChange(THEME_NAME.DARK)}
        >
          <Svg src={MoonIcon} fill={theme.colors['gray'][600]} />
        </IconWrapper>
      ) : (
        <IconWrapper
          title="light-icon"
          onClick={() => onThemeChange(THEME_NAME.LIGHT)}
        >
          <Svg src={SunIcon} fill={theme.colors['gray'][100]} />
        </IconWrapper>
      )}
    </>
  )
}

export default ThemeSwitcher
