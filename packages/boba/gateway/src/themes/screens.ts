import { css } from 'styled-components'

const size = {
  mobile: '767px',
  tablet: '980px',
  desktop: '1200px',
}

export const screen = {
  mobile: `(max-width : ${size.mobile})`,
  tablet: `(max-width : ${size.tablet})`,
  laptop: `(max-width : ${size.desktop})`,
}

export const mobile = (inner: any) => css`
  @media (max-width: ${size.mobile}) {
    ${inner};
  }
`
export const tablet = (inner: any) => css`
  @media (max-width: ${size.tablet}) {
    ${inner};
  }
`
export const desktop = (inner: any) => css`
  @media (max-width: ${size.desktop}) {
    ${inner};
  }
`
