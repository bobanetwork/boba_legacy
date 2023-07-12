import styled from 'styled-components'
import { Row } from 'components/global/containers'

export const TableHeaderContainer = styled(Row)`
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px 6px 0 0;
  background: ${(props) => props.theme.colors.gray[800]};
  @media (max-width: 960px) {
    margin-bottom: 5px;
  }
`

export const TableContentContainer = styled(Row)`
  justify-content: space-between;
`

export const TableRow = styled(Row)`
  &:not(:first-of-type) {
    margin-left: auto;
  }
  &:last-of-type {
    margin-right: 0px;
  }
`
