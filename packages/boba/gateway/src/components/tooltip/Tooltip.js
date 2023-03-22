import React from 'react'
import { Tooltip as MuiTooltip } from '@mui/material'
import * as S from './Tooltip.styles';



function Tooltip({ title, arrow = true, children }) {
  if (title) {
    return (
      <MuiTooltip
        title={<S.Title>{title}</S.Title>}
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
