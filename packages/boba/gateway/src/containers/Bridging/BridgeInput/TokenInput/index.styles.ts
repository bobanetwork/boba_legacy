import { Typography } from 'components/global'
import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  width: calc(75% - 24px);
  max-width: calc(75% - 24px);
  ${mobile(css`
    width: calc(60% - 24px);
    max-width: calc(60% - 24px);
  `)}
`
export const InputContainerLabel = styled(Typography).attrs({
  variant: 'body3',
})`
  color: ${({ theme, error }) =>
    error ? theme.colors.red[300] : theme.colors.color};
  align-self: flex-end;
  font-weight: 400;
`
