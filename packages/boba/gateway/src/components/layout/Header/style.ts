import styled from 'styled-components'
import BobaLogoImage from 'assets/images/boba-logo.png'
import { Svg } from 'components/global'

export const HeaderContainer = styled.div`
  height: 73px;
  margin: 0px 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`

export const BobaLogo = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 32px;
  background: ${({ theme }) => `url(${BobaLogoImage}) no-repeat`};
  background-position: 100%;
  background-size: contain;
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
