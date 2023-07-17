import { Typography } from 'components/global'
import styled from 'styled-components'

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
export const NetworkItem = styled.div`
  cursor: pointer;
  display: flex;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;

  &:hover {
    border-radius: 8px;
    background: var(--gray-400, #393939);
  }
`
export const NetworkIcon = styled.div``
export const NetworkLabel = styled(Typography).attrs({
  variant: 'body1',
})`
  color: ${(props) => props.theme.colors.gray[50]};
  text-align: right;
`
