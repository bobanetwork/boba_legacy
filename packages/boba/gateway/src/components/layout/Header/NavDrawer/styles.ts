import styled, { css } from 'styled-components'
import Close from 'assets/images/close.svg'
import { Heading, Svg } from 'components/global'
import { mobile } from 'themes/screens'

export const DrawerContainer = styled.div`
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: flex-strech;
  width: 100vw;
  height: 100vh;
  ${mobile(css`
    display: flex;
  `)}
`
export const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px;
`
export const CloseIcon = styled(Svg).attrs({
  src: Close,
  fill: '#fff',
})``
export const ActionContainer = styled.div``
export const ActionItem = styled.div``
export const ActionLabel = styled.div``
export const ActionValue = styled.div``
export const NavList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 40px;
`
export const NavItem = styled(Heading).attrs({
  variant: 'h2',
})``
