import React from 'react'
import { useLocation } from 'react-router-dom'
import { BackgroundPosition, RoutesWithBackgroundPositionAtTop } from './types'
import {
  BackgroundContainer,
  GridBackground,
  GridFade,
  GridLines,
} from './styles'

export const Background = () => {
  const location = useLocation()
  const currentPath = location.pathname
  const isPositionTop: BackgroundPosition =
    RoutesWithBackgroundPositionAtTop.includes(currentPath)
      ? BackgroundPosition.TOP
      : BackgroundPosition.CENTER

  return (
    <BackgroundContainer>
      <GridBackground>
        <GridFade position={isPositionTop} />
        <GridLines />
      </GridBackground>
    </BackgroundContainer>
  )
}
