import { ThemeProvider } from 'styled-components'

import React, { ReactNode, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectTheme } from 'selectors'
import light from './light'
import dark from './dark'
import { GlobalStyle } from './globalStyle'

interface ThemeProps {
  children: ReactNode
}

const Theme = ({ children }: ThemeProps) => {
  const [currentTheme, setCurrentTheme] = useState(dark)
  const theme = useSelector(selectTheme)

  useEffect(() => {
    if (theme === 'light') {
      setCurrentTheme(light)
    } else {
      setCurrentTheme(dark)
    }
  }, [theme])

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  )
}

export default Theme
