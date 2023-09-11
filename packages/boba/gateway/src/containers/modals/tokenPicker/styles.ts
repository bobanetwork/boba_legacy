import { Typography } from 'components/global'
import styled, { css } from 'styled-components'
import PlusIconOutline from '@mui/icons-material/AddCircleOutlineOutlined'

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
  color: ${(props) => props.theme.color};
  border: 1px solid ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[600] : colors.gray[300]};
  background: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[100] : colors.gray[500]};

  /* Green Hilight */
  &: focus, &: hover , &: focus-visible{
    border: 1px solid ${({ theme }) => theme.colors.green[300]};
  }
`

export const ListLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  text-align: left;
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[700] : colors.gray[50]};
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
      background: ${({ theme: { colors } }) => colors.gray[400]};
    `}
  &:hover {
    border-radius: 8px;
    background: ${({ theme: { colors } }) => colors.gray[400]};
  }
`
export const TokenSymbol = styled.div`
  display: flex;
`
export const TokenLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  flex: 1;
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[700] : colors.gray[50]};
`

export const TokenBalance = styled.span`
  font-family: Roboto;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  display: inline;
  margin-left: 5px;
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[600] : colors.gray[100]};
`

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
  font-size: 14px;
  border: 2px solid
    ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[600] : colors.gray[200]};
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[600] : 'colors.gray[200]'};

  ${({ selected, theme: { colors, name } }) =>
    selected &&
    css`
      border: 2px solid
        ${name === 'light' ? colors.gray[800] : colors.green[300]};
      color: ${name === 'light' ? colors.gray[800] : '#fff'};
    `}

  &: hover {
    border: 2px solid
      ${({ theme: { colors, name } }) =>
        name === 'light' ? colors.gray[800] : colors.green[300]};
    color: ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[800] : '#fff'};
  }
`

export const PlusIcon = styled(PlusIconOutline)`
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[700] : colors.color};
`
