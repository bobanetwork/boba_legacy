import React from 'react'
import {
  BackgroundContainer,
  GridBackground,
  GridFade,
  GridLines,
} from './styles'

export const Background = () => (
  <BackgroundContainer>
    <GridBackground>
      <GridFade />
      <GridLines />
    </GridBackground>
  </BackgroundContainer>
)
