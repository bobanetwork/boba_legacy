import { Button, Typography } from 'components/global'
import styled from 'styled-components'

export const SwapContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[600] : colors.green[300]};
  background: ${({ theme: { name } }) =>
    name === 'light' ? 'transparant' : 'rgba(238, 238, 238, 0.05)'};
`
export const SwapAlert = styled(Typography).attrs({
  variant: 'body3',
})`
  font-weight: 400;
  line-height: normal;
  color: ${({ theme, color }) =>
    color
      ? color
      : theme.name === 'light'
      ? theme.colors.gray[700]
      : theme.colors.gray[100]};
`
export const SwapAction = styled(Button)`
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-item: center;
  justify-content: center;
`
