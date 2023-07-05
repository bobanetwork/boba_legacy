import { Typography } from 'components/global'
import styled from 'styled-components'

export const CircleIndicator = styled.div`
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #0787af;
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
