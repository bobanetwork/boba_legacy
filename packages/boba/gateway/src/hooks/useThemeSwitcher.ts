import { setTheme } from 'actions/uiAction'
import { THEME_NAME } from 'components/layout/Header/types'
import { useDispatch, useSelector } from 'react-redux'
import { selectModalState } from 'selectors'

const useThemeSwitcher = () => {
  const currentTheme = useSelector(selectModalState('theme'))
  const dispatch = useDispatch<any>()

  const setThemeLight = () => {
    localStorage.setItem('theme', THEME_NAME.LIGHT)
    dispatch(setTheme(THEME_NAME.LIGHT))
  }
  const setThemeDark = () => {
    localStorage.setItem('theme', THEME_NAME.DARK)
    dispatch(setTheme(THEME_NAME.DARK))
  }

  return {
    setThemeLight,
    setThemeDark,
    currentTheme,
  }
}

export default useThemeSwitcher
