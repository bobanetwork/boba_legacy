import styled from 'styled-components'
import { Row } from 'components/global/containers'
import { screen } from 'themes/screens'

export const TableHeaderContainer = styled(Row)`
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px 6px 0 0;
  background: ${(props) => props.theme.colors.gray[800]};
  ${screen.mobile} {
    margin-bottom: 5px;
  }
  ${screen.tablet} {
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
