
import { useTheme } from '@emotion/react'
import { useMediaQuery } from '@mui/material'
import React from 'react'
import Monster from './Monster'

export default function MonsterWrapper({ ...rest }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  return <Monster {...rest} isMobile={isMobile} />
}
