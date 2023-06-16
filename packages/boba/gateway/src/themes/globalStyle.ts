import { createGlobalStyle } from 'styled-components'

export interface DefaultThemeProps {
  background: string
  color: string
}

export const GlobalStyle = createGlobalStyle<{ theme: DefaultThemeProps }>`
  body {
    font-family: 'Roboto', sans-serif;
    background: ${({ theme }) => theme.background};
    color:  ${({ theme }) => theme.color};
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Montserrat', sans-serif;
  }
`
