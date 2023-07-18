import styled, { css } from 'styled-components'
import { TableHeader, TableContent } from 'components/global/table'
import { Svg } from 'components/global/svg'
import { TableContentContainer, TableHeaderContainer, TableRow } from './styles'
import { Row } from 'components/global/containers'

export const TransactionsTableHeader = styled(TableHeader)`
  padding: 8px 24px 4px 24px;
  background: none;
  position: sticky;
  top: 0;
  border-radius: unset;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[700]};
      border-top: 1px solid ${props.theme.colors.gray[400]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[100]};
      border-top: 1px solid ${props.theme.colors.gray[300]};
    `}
    ${TableRow} {
    border: none;
    margin: 0px;
    padding 0px;
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
  &: hover {
    background: ${(props) => props.theme.colors.gray[300]};
  }
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      fill: ${props.theme.colors.gray[600]};
    `}
  ${TableRow} {
    margin: 0px;
    padding 0px;
  }
`
export const AllNetworksIcon = styled(Svg)`
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      fill: ${props.theme.colors.gray[100]};
    `}
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      fill: ${props.theme.colors.gray[600]};
    `}
`
