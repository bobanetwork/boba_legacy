import React from 'react'
import styled, { css, ThemeProvider } from 'styled-components'
import { Decorator } from '@storybook/react'
import { Preview } from '@storybook/react'
import light from '../src/themes/light'
import dark from '../src/themes/dark'
import { GlobalStyle } from '../src/themes/globalStyle'

import '../src/index.scss'

import { Buffer } from 'buffer'

//@ts-ignore
if (!window.Buffer) {
  //@ts-ignore
  window.Buffer = window.Buffer || Buffer
}

const ThemeBlock = styled.div<{ left?: boolean; fill?: boolean }>(
  ({ left, fill, theme }) =>
    css`
      position: absolute;
      top: 0;
      left: ${left || fill ? 0 : '50vw'};
      border-right: ${left ? '1px solid #202020' : 'none'};
      right: ${left ? '50vw' : 0};
      width: ${fill ? '100vw' : '50vw'};
      height: 100vh;
      bottom: 0;
      overflow: auto;
      padding: 1rem;
      box-sizing: border-box;
      background: ${theme.background};
    `
)

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
}

export default preview

export const withTheme: Decorator = (StoryFn, context) => {
  const theme = context.parameters.theme || context.globals.theme
  const storyTheme = theme === 'light' ? light : dark

  switch (theme) {
    // FIXME: Not working correctly only dark theme is getting applied at both places.
    case 'side-by-side': {
      return (
        <>
          <ThemeProvider theme={light}>
            <ThemeBlock left>
              <GlobalStyle />
              <StoryFn />
            </ThemeBlock>
          </ThemeProvider>
          <ThemeProvider theme={dark}>
            <ThemeBlock>
              <GlobalStyle />
              <StoryFn />
            </ThemeBlock>
          </ThemeProvider>
        </>
      )
    }
    default: {
      return (
        <ThemeProvider theme={storyTheme}>
          <ThemeBlock fill>
            <GlobalStyle />
            <StoryFn />
          </ThemeBlock>
        </ThemeProvider>
      )
    }
  }
}

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Theme for the components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', icon: 'circlehollow', title: 'Light Theme' },
        { value: 'dark', icon: 'circle', title: 'Dark Theme' },
        { value: 'side-by-side', icon: 'sidebar', title: 'Both Themes' },
      ],
      showName: true,
    },
  },
}

export const decorators = [withTheme]
