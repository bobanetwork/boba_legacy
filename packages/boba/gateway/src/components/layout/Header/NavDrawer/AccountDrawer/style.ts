import { Typography } from 'components/global'
import styled from 'styled-components'

export const ItemLabel = styled(Typography).attrs({
  variant: 'body3',
})`
  color: ${(props) => props.theme.color};
`

export const MenuItemStyle = styled.button.attrs({
  variant: 'body3',
})`
  width: 100%;
  border-radius: 8px;
  background: var(--gray-400, #393939);
  border: none;
  padding: 15px 10px;
  margin-bottom: 5px;
  gap: 10px !important;
  display: flex !important;
  align-items: center;
  justify-content: flex-start;
`

export const AccountContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  justify-content: flex-start;
  padding: 16px;
  width: 100%;
  background: #262626;
`
export const Content = styled.div`
  padding: 8px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`

export const Action = styled.div`
  width: 100%;
  margin-bottom: 10px;
`
