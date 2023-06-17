import { Typography } from 'components/global'
import styled from 'styled-components'

export const StyledFooter = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0px 32px;
`

export const GasListContainer = styled.div`
  self-align: flex-end;
  display: flex;
  gap: 24px;
  justify-content: flex-end;
`

export const GasListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`

export const GasListItemLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${({ theme }) => theme.colors['gray'][100]};
`

export const GasListItemValue = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${({ theme }) => theme.colors['gray'][200]};
`

export const DividerLine = styled.hr`
  border-color: ${({ theme }) => theme.colors['gray'][200]};
  box-sizing: border-box;
  width: 100%;
`
