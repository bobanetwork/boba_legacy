
/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React from 'react'

import { useTheme } from '@emotion/react'

import * as styles from './CounterButton.module.scss';

function CounterButton ({
  children,
  style,
  onClick,
  color,
  variant,
  fullWidth,
  disabled,
  loading,
  sx,
  pulsate,
  tooltip = '',
  size,
  className,
  plus,
  minus,
}) {

  const theme = useTheme()

  let buttonColor
  if (theme.palette.mode === 'light') {
    buttonColor = disabled ? 'rgba(0, 0, 0, 0.2)': 'rgba(0, 0, 0, 0.4)'
  } else {
    buttonColor = disabled ? 'rgba(255,255,255,0.2)': 'rgba(255,255,255,0.4)'
  }
  return (
    <div
      className={disabled ? styles.container_disabled: styles.container}
      style={{borderColor: buttonColor}}
      onClick={disabled ? () => '': onClick}
    >
      {!minus || plus ?
        <div className={styles.line1} style={{backgroundColor: buttonColor}}></div>: <></>
      }
      <div className={styles.line2} style={{backgroundColor: buttonColor}}></div>
    </div>
  )
}

export default React.memo(CounterButton);
