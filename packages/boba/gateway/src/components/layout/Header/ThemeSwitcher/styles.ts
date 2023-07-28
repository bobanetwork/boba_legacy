import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const IconWrapper = styled.div`
  border-radius: 50%;
  cursor: pointer;
  &:hover {
    background: ${({ theme: { name, colors } }) =>
      name === 'light' ? colors.gray[400] : colors.gray[300]};
  }
  div {
    padding: 4px;
    height: 32px;
    width: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  ${mobile(css`
    display: none;
  `)}
`
