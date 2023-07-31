import styled, { css } from 'styled-components'
import { HeadingStyleProps, VariantType } from './types'

const options: Record<string, HeadingStyleProps> = {
  h1: {
    size: '36px',
    lineHeight: '44px',
    fontWeight: 700,
  },
  h2: {
    size: '24px',
    lineHeight: '29px',
    fontWeight: 700,
  },
  h3: {
    size: '18px',
    lineHeight: '22px',
    fontWeight: 700,
  },
  h4: {
    size: '13px',
    lineHeight: '16px',
    fontWeight: 700,
  },
  h5: {
    size: '12px',
    lineHeight: '14px',
    fontWeight: 700,
  },
}

export const StyledHeading = styled.h1<{ variant?: VariantType }>`
  font-style: normal;
  font-weight: 700;

  ${({ variant }) =>
    variant &&
    options[variant] &&
    css`
      font-size: ${options[variant].size};
      line-height: ${options[variant].lineHeight};
      font-weight: ${options[variant].fontWeight};
    `}
`
