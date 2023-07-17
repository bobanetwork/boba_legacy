import { Typography } from 'components/global'
import styled, { css } from 'styled-components'
export const TokenPickerModalContainer = styled.div`
  width: 100%;
`
export const TokenPickerList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
`
export const TokenListItem = styled.div<{ selected?: boolean }>`
  cursor: pointer;
  display: flex;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  ${({ selected }) =>
    selected &&
    css`
      border-radius: 8px;
      border: 1px solid var(--gray-100, #a8a8a8);
      background: var(--gray-400, #393939);
    `}
  &:hover {
    border-radius: 8px;
    background: var(--gray-400, #393939);
  }
`
export const TokenSymbol = styled.div`
  display: flex;
`
export const TokenLabel = styled(Typography).attrs({
  variant: 'body1',
})`
  flex: 1;
  color: ${(props) => props.theme.colors.gray[50]};
`

export const TokenBalance = styled(Typography).attrs({
  variant: 'body2',
})``
