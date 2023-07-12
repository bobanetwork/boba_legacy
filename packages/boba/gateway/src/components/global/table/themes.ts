import styled, { css } from 'styled-components'
import { TableHeader, TableContent } from 'components/global/table'
import { TableContentContainer, TableHeaderContainer, TableRow } from './styles'
import { Row } from 'components/global/containers'

export const TransactionsTableHeader = styled(TableHeader)`
  padding: 8px 24px 4px 24px;
  background: none;
  position: sticky;
  top: 0;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[700]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[100]};
    `}
  ${TableRow} {
    p {
      font-size: 12px;
    }
  }
`

export const TransactionsTableContent = styled(TableContent)`
  padding: 16px 24px;
  ${TableRow} {
    border: none;
  }
`
