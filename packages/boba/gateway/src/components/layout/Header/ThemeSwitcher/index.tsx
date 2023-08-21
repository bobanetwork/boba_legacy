import { Svg } from 'components/global'
import React, { FC } from 'react'

import MoonIcon from 'assets/images/theme-moon.svg'
import SunIcon from 'assets/images/theme-sun.svg'
import useThemeSwitcher from 'hooks/useThemeSwitcher'
import { useTheme } from 'styled-components'
import { THEME_NAME } from '../types'
import { IconWrapper } from './styles'

const ThemeSwitcher: FC = () => {
  const { currentTheme, setThemeDark, setThemeLight } = useThemeSwitcher()
  const theme: any = useTheme()

  return (
    <>
      {currentTheme === THEME_NAME.LIGHT ? (
        <IconWrapper title="dark-icon" onClick={setThemeDark}>
          <Svg src={MoonIcon} fill={theme.colors['gray'][600]} />
        </IconWrapper>
      ) : (
        <IconWrapper title="light-icon" onClick={setThemeLight}>
          <Svg src={SunIcon} fill={theme.colors['gray'][100]} />
        </IconWrapper>
      )}
    </>
  )
}

export default ThemeSwitcher
