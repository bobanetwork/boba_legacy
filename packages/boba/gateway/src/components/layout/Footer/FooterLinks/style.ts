import { NavLink } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const LinkContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 25px 0;
  div {
    display: flex;
    gap: 24px;
  }

  ${mobile(css`
    width: 100%;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  `)}
`

export const StyledLink = styled.a`
  font-size: 14px;
  line-height: 16px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][600]
      : theme.colors['gray'][200]};
  &:hover,
  &.active {
    color: ${({ theme }) =>
      theme.name === 'light'
        ? theme.colors['gray'][800]
        : theme.colors['gray'][100]};
  }
`
export const StyledNavLink = styled(NavLink)`
  font-size: 14px;
  line-height: 16px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][600]
      : theme.colors['gray'][200]};
  &:hover,
  &.active {
    color: ${({ theme }) =>
      theme.name === 'light'
        ? theme.colors['gray'][800]
        : theme.colors['gray'][100]};
  }
`
