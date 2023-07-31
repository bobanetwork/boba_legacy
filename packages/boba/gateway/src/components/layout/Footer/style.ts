import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const StyledFooter = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 32px 32px 0px;
`

export const DividerLine = styled.hr`
  border-color: ${({ theme }) => theme.colors['gray'][200]};
  box-sizing: border-box;
  width: 100%;
  ${mobile(css`
    display: none;
  `)}
`
