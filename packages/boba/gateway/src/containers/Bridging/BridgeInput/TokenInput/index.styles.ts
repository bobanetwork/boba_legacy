import { Typography } from 'components/global'
import styled from 'styled-components'

export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  width: calc(75% - 24px);
  max-width: calc(75% - 24px);
`
export const InputContainerLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${(props) => props.theme.colors.gray[100]};
  align-self: flex-end;
`
