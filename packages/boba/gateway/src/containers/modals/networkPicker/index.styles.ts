import { Typography } from 'components/global'
import styled, { css } from 'styled-components'

export const NetworkPickerModalContainer = styled.div`
  width: 100%;
`
export const NetworkPickerList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
`
export const NetworkItem = styled.div<{ selected?: boolean }>`
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
export const NetworkIcon = styled.div`
  display: flex;
  width: 30px;
  height: 30px;
`
export const NetworkLabel = styled(Typography).attrs({
  variant: 'body1',
})`
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[700] : colors.gray[50]};
  text-align: right;
`

styled(Typography).attrs({
  variant: 'body2',
})`
  text-align: left;
  color: ${({ theme }) => theme.colors.gray[50]};
`
