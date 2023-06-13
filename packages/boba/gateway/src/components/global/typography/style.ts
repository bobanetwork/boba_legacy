import styled, { css } from 'styled-components'
import { TypographyStyleProps, VariantType } from './types'

const options: Record<string, TypographyStyleProps> = {
  head: {
    size: '20px',
    lineHeight: '23px',
    fontWeight: 500,
  },
  title: {
    size: '18px',
    lineHeight: '21px',
    fontWeight: 500,
  },
  body1: {
    size: '16px',
    lineHeight: '19px',
    fontWeight: 500,
  },
  body2: {
    size: '14px',
    lineHeight: '16px',
    fontWeight: 500,
  },
  body3: {
    size: '12px',
    lineHeight: '14px',
    fontWeight: 500,
  },
  subtitle: {
    size: '12px',
    lineHeight: '14px',
    fontWeight: 400,
  },
}

export const StyledText = styled.p<{ variant?: VariantType }>`
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;

  ${({ variant }) =>
    variant &&
    options[variant] &&
    css`
      font-size: ${options[variant].size};
      line-height: ${options[variant].lineHeight};
      font-weight: ${options[variant].fontWeight};
    `}
`
