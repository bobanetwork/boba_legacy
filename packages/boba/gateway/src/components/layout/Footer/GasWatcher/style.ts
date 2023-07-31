import { Typography } from 'components/global'
import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const GasListContainer = styled.div`
  self-align: flex-end;
  display: flex;
  gap: 24px;
  justify-content: flex-end;
  ${mobile(css`
    display: none;
  `)}
`

export const GasListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`

export const GasListItemLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][600]
      : theme.colors['gray'][100]};
};
`

export const GasListItemValue = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][700]
      : theme.colors['gray'][200]};};
`
