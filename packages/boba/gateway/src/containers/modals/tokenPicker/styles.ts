import { Typography } from 'components/global'
import styled, { css } from 'styled-components'
export const TokenPickerModalContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

export const TokenSearchContainer = styled.div`
  display: flex;
  width: 100%;
`
export const TokenSearchInput = styled.input`
  display: flex;
  width: 100%;
  padding: 12px 16px;
  align-items: center;
  font-size: 16px;
  gap: 8px;
  border-radius: 12px;
  color: #FFF;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[500]};

  /* Green Hilight */
  &: focus, &: hover {
    border: 1px solid ${({ theme }) => theme.colors.green[300]};
    box-shadow: 0px 4px 10px 0px rgba(186, 226, 26, 0.1);
  }
`

export const ListLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  text-align: left;
  color: ${({ theme }) => theme.colors.gray[50]};
`

export const TokenPickerList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  height: 330px;
  overflow-y: scroll;
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
  variant: 'body2',
})`
  flex: 1;
  color: ${(props) => props.theme.colors.gray[50]};
`

export const TokenBalance = styled(Typography).attrs({
  variant: 'body2',
})``

export const TokenPickerAction = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
`
export const ActionLabel = styled.div<{ selected?: boolean }>`
  cursor: pointer;
  display: flex;
  padding: 4px 16px;
  align-items: flex-start;
  gap: 10px;
  border-radius: 24px;
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[100]};

  ${({ selected }) =>
    selected &&
    css`
      border: 2px solid ${(props) => props.theme.colors.green[300]};
      color: #fff;
    `}

  &: hover {
    border: 2px solid ${(props) => props.theme.colors.green[300]};
    color: #fff;
  }
`
