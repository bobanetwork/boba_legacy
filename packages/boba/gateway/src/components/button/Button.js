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
import { CircularProgress, Tooltip } from '@mui/material'
import { Button as ButtonMUI } from '@mui/material'

function Button ({
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
  triggerTime,
}) {

  if(disabled || loading)
    pulsate = false

  let timeDefined = false
  if(typeof triggerTime !== 'undefined') {
    timeDefined = true
  }

  // Save the current date to be able to trigger an update
  const [now, setTime] = React.useState(new Date())

  React.useEffect(() => {
    if (loading) {
      const timer = setInterval(()=>{setTime(new Date())}, 1000)
      return () => {clearInterval(timer)}
    }
  }, [loading])

  let waitTime = (now-triggerTime) / 1000
  if(waitTime < 0) waitTime = 0
  waitTime = Math.round(waitTime)

  const muiProps = {
    color,
    variant,
    fullWidth,
    onClick: loading || disabled ? null : onClick,
    disabled,
    size,
    sx,
  }

  const styleCombo = {
    ...style, 
    minWidth: loading ? '200px' : '103px', 
    borderRadius: '12px'
  }

  return (
    <Tooltip title={tooltip}>
      <span>
        <ButtonMUI {...muiProps} style={styleCombo}>
          {children}
          {(disabled || loading) && timeDefined && (waitTime > 3) &&
            <div style={{ marginLeft: '10px' }}>
              {waitTime}s ago
            </div>
          }
          {loading &&
            <div style={{ paddingTop: '4px', marginLeft: '10px' }}>
              <CircularProgress size={14} color='inherit' />
            </div>
          }
        </ButtonMUI>
      </span>
  </Tooltip>
  )
}

export default React.memo(Button)
