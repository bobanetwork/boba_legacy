import { HelpOutline } from '@mui/icons-material'
import { Heading, Typography } from 'components/global'
import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const FeeSwitcherWrapper = styled.div`
  display: flex;
  gap: 8px;
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

export const FeeSwitcherIcon = styled(HelpOutline)`
  color: ${({ theme }) => theme.colors.gray[100]};
`

export const MenuItemStyle = styled(Typography).attrs({
  variant: 'body3',
})`
  padding: 5px 10px;
  gap: 10px !important;
  display: flex !important;
  align-items: center;
  justify-content: space-around;
`

export const FeeSwitcherLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
`
export const FeeLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${({ theme: { name, colors } }) =>
    name === 'light' ? colors.gray[600] : colors.gray[100]};
`
