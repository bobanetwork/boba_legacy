import React from 'react'
import {
  PreloaderContainer,
  Preload,
  Number,
  Title,
  Label,
  Arrow,
} from './styles'

export const Preloader = () => {
  const limit = 4

  return (
    <PreloaderContainer>
      {Array.from({ length: limit }).map((_, index) => (
        <Preload key={index}>
          <Number />
          <Title />
          <Label />
          <Arrow />
        </Preload>
      ))}
    </PreloaderContainer>
  )
}
