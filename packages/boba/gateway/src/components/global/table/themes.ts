import styled, { css } from 'styled-components'
import { TableHeader, TableContent } from 'components/global/table'
import { Svg } from 'components/global/svg'
import { TableRow } from './styles'
import { mobile, sdesktop } from 'themes/screens'
export const TransactionsTableHeader = styled(TableHeader)`
  padding: 10px 24px 10px 24px;
  position: sticky;
  top: 0;
  background: unset;
  border-radius: unset;
  border: unset;
  box-shadow: none;
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
    padding: 0px;
    p {
      font-size: 12px;
    }
  }
  ${sdesktop(css`
    width: 750px;
  `)}
  ${mobile(css`
    p {
      font-size: 10px;
    }
  `)}
`

export const TransactionsTableContent = styled(TableContent)`
  padding: 16px 24px;
  ${TableRow} {
    border: none;
  }
  &:hover {
    background: ${(props) => props.theme.colors.gray[300]};
  }
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      fill: ${props.theme.colors.gray[600]};
    `}
  ${TableRow} {
    margin: 0px;
    padding: 0px;
  }
`
