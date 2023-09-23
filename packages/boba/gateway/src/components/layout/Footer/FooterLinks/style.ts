import { NavLink } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const StyledLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`
export const ScanContainer = styled.div`
  margin: 10px 0px;
`

export const ExplorereButton = styled.button`
  display: flex;
  padding: 8px 16px;
  justify-content: center;
  align-items: center;
  gap: 11px;
  border-radius: 28px;
  font-family: Roboto;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[100]};
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  &:hover {
    border: 1px solid ${({ theme }) => theme.colors.green[300]};
  }
`

export const LinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  margin: 0;
  gap: 32px;

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
