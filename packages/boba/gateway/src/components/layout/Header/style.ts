import styled from 'styled-components'
import BobaLogoImage from 'assets/images/boba-logo.png'
import { Svg, Typography } from 'components/global'

export const HeaderContainer = styled.div`
  width: 100%;
  height: 73px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const HeaderNav = styled.div`
  display: flex;
  justify-self: flex-start;
  gap: 24px;
  flex: 1;
`

export const BobaLogo = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 32px;
  background: ${({ theme }) => `url(${BobaLogoImage}) no-repeat`};
  background-position: 100%;
  background-size: contain;
`

export const NavItem = styled(Typography)<{ active?: string }>`
  text-transform: uppercase;
  cursor: pointer;
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][600]
      : theme.colors['gray'][100]};
  &:hover {
    color: ${({ theme }) =>
      theme.name === 'light'
        ? theme.colors['gray'][800]
        : theme.colors['green'][300]};
  }
`

export const HeaderAction = styled.div`
  display: flex;
  gap: 32px;
  align-items: center;
  justify-self: flex-end;
  justify-content: space-between;
`

export const ActionIcon = styled(Svg)`
  cursor: pointer;
`
