import styled, { css } from 'styled-components'
import BobaLogoImage from 'assets/images/boba-logo.png'
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
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: rgba(255, 255, 255, 0.5);
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: rgba(0, 0, 0, 0.05);
    `}

    ${mobile(css`
    padding: 0px 16px;
  `)}
`

export const BobaLogo = styled.div`
  width: 40px;
  height: 40px;
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
  gap: 32px;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
`

export const ActionIcon = styled(Svg)`
  cursor: pointer;
`
