import { HelpOutline } from '@mui/icons-material'
import { Heading, Typography } from 'components/global'
import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const FeeSwitcherWrapper = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: space-around;
  ${mobile(css`
    display: none;
  `)}
`

export const FeeSwitcherLabel = styled(Heading).attrs({
  variant: 'h5',
})`
  white-space: nowrap;
  padding: 5px 10px;
`

export const FeeSwitcherIcon = styled(HelpOutline)``

export const MenuItemStyle = styled(Typography).attrs({
  variant: 'body3',
})`
  padding: 5px 10px;
  gap: 10px !important;
  display: flex !important;
  align-items: center;
  justify-content: space-around;
`
