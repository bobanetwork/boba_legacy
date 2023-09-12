import styled, { css } from 'styled-components'
import BobaLogoImage from 'assets/images/boba-logo.png'
import MenuIcon from 'assets/images/hamburger.svg'
import { Svg } from 'components/global'
import { mobile } from 'themes/screens'

export const HeaderContainer = styled.div`
  height: 73px;
  margin: 0px;
  padding: 0px 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  backdrop-filter: blur(7.5px);
  z-index: 9999;
  background: ${({ theme: { name, colors } }) =>
    name === 'light' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.05)'};

  ${mobile(css`
    padding: 0px 16px;
  `)}
`

export const BobaLogo = styled.div`
  width: 30px;
  height: 32px;
  margin-right: 32px;
  background: ${({ theme }) => `url(${BobaLogoImage}) no-repeat`};
  background-position: 100%;
  background-size: contain;
  ${mobile(css`
    width: 32px;
    height: 32px;
    margin-right: 12px;
  `)}
`

export const HeaderAction = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
  gap: 15px;
  ${mobile(css`
    gap: 8px;
  `)}
`

export const MobileMenuIcon = styled.div`
  display: none;

  ${mobile(css`
    display: block;
  `)}
`

export const HumberIcon = styled(Svg).attrs({
  src: MenuIcon,
  fill: 'current',
})`
  stroke: ${({ theme }) =>
    theme.name === 'light' ? theme.colors.gray[600] : '#fff'};
  fill: ${({ theme }) =>
    theme.name === 'light' ? theme.colors.gray[600] : '#fff'};

  ${mobile(css`
    display: block;
    height: 34px;
    width: 32px;
    div {
      display: flex;
      align-items: center;
    }
  `)}
`
