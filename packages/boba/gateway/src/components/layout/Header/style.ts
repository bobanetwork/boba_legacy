import styled from 'styled-components'
import LogoDark from '../../../assets/images/logo-dark.png'
import LogoLight from '../../../assets/images/logo-light.png'
import { Typography } from 'components/global'

export const HeaderContainer = styled.div`
  width: 100%;
  display: flex;
  justifycontent: space-around;
`

export const BobaLogo = styled.div`
  width: 40px;
  height: 40px;
  background: ${({ theme }) =>
    `url(${theme.name === 'light' ? LogoLight : LogoDark})`};
`

export const NavItem = styled(Typography)<{ active?: string }>`
  text-transform: uppercase;
`
