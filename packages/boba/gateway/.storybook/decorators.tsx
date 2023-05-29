import React from 'react'
import { ThemeProvider } from 'styled-components'
import { Decorator } from '@storybook/react'
import light from '../src/themes/light'

const withTheme: Decorator = (StoryFn) => (
  <ThemeProvider theme={light}>
    <StoryFn />
  </ThemeProvider>
)

export const decorators = [withTheme]
