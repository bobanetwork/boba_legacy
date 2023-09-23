import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const StyledFooter = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 24px 32px;
`

export const DividerLine = styled.hr`
  border-color: ${({ theme }) => theme.colors['gray'][200]};
  box-sizing: border-box;
  width: 100%;
  ${mobile(css`
    display: none;
  `)}
`

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`
