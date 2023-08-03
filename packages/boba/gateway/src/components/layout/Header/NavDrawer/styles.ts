import Close from 'assets/images/close.svg'
import { Typography, Svg, Heading } from 'components/global'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

export const CloseIcon = styled(Svg).attrs({
  src: Close,
  fill: '#fff',
})``

export const StyleDrawer = styled.div`
  height: 100%;
  background: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[200] : colors.gray[600]};
`

export const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
`

export const WrapperCloseIcon = styled.div`
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
    border-radius: 50%;
  }
`

export const HeaderDivider = styled.div`
  box-sizing: border-box;
  width: 100%;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[300]};
`

export const ActionContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 2px;
`
export const ActionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  gap: 8px;
`
export const ActionIcon = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 50%;
  background: blue;
  justify-self: flex-start;
`
export const ThemeIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  div {
    padding: 4px;
    height: 32px;
    width: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`
export const ActionLabel = styled(Typography).attrs({
  variant: 'title',
})`
  flex: 1;
  justify-self: flex-start;
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][800]
      : theme.colors['gray'][100]};
`
export const ActionValue = styled.button.attrs({
  variant: 'title',
})`
  border: none;
  background: transparent;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][800]
      : theme.colors['gray'][50]};

  &:after {
    content: '\\27E9';
    font-size: 19px;
    font-weight: 600;
    display: inline-block;
    padding-left: 10px;
    color: ${({ theme }) =>
      theme.name === 'light'
        ? theme.colors['gray'][800]
        : theme.colors['gray'][50]};
  }
`

export const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 40px 16px;
`
export const NavLinkItem = styled(NavLink)`
  padding: 0px 16px;
  font-family: Montserrat;
  font-size: 24px;
  font-style: normal;
  line-height: normal;
  font-weight: 700;
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
