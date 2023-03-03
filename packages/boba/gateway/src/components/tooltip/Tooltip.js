import React from 'react'
import { Tooltip as MuiTooltip } from '@mui/material'
import * as styles from './Tooltip.module.scss'

function Tooltip({ title, arrow = true, children }) {
  if (title) {
    return (
      <MuiTooltip
        title={<div className={styles.title}>{title}</div>}
        arrow={arrow}
      >
        {children}
      </MuiTooltip>
    )
  } else {
    return children
  }
}

export default React.memo(Tooltip)
