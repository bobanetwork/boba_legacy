import { Button, Typography } from 'components/global'
import styled from 'styled-components'

export const ConfirmModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
`
export const ConfirmLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${({ theme }) => theme.colors.gray[100]};
`
export const ConfirmValue = styled(Typography).attrs({
  variant: 'body1',
})`
  color: ${({ theme }) => theme.colors.gray[50]};
  text-transform: capitalize;
`

export const LayerNames = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
`

export const ConfirmActionButton = styled(Button)`
  width: 100%;
`

export const Item = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
`
