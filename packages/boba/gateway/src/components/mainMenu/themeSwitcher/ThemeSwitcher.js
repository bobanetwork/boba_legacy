import React from 'react'
import * as S from './ThemeSwitcher.styles.js'
import DarkIcon from 'components/icons/DarkIcon.js'
import LightIcon from 'components/icons/LightIcon.js'
import { setTheme } from 'actions/uiAction.js'
import { useSelector } from 'react-redux'
import { selectModalState } from 'selectors/uiSelector.js'
import { useDispatch } from 'react-redux'
import { IconButton } from '@mui/material'

function ThemeSwitcher() {
  const theme = useSelector(selectModalState('theme'));
  const dispatch = useDispatch();
  return (
    <S.ThemeSwitcherTag>
      {theme === 'light' ?
        <IconButton onClick={() => {
          localStorage.setItem('theme', 'dark');
          dispatch(setTheme('dark'));
        }} selected={true}>
          <DarkIcon />
        </IconButton>
        : <IconButton onClick={() => {
          localStorage.setItem('theme', 'light');
          dispatch(setTheme('light'));
        }} selected={true}>
          <LightIcon />
        </IconButton>}
    </S.ThemeSwitcherTag>
  );
}

export default ThemeSwitcher;
