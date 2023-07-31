import { NavLink } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const StyledNav = styled.div`
  display: flex;
  gap: 24px;
  ${mobile(css`
    display: none;
  `)}
`

export const NavLinkItem = styled(NavLink)`
  font-size: 14px;
  line-height: 16px;
  font-weight: 500;
  text-transform: uppercase;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][600]
      : theme.colors['gray'][100]};
  &:hover,
  &.active {
    color: ${({ theme }) =>
      theme.name === 'light'
        ? theme.colors['gray'][800]
        : theme.colors['green'][300]};
  }
`
