import styled, { css } from 'styled-components'

export const InputStyle = styled.input`
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[400]};
      border: 1px solid ${props.theme.colors.gray[500]};
      color: ${props.theme.colors.gray[600]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[500]};
      border: 1px solid ${props.theme.colors.gray[300]};
      color: ${props.theme.colors.green[200]};
    `}
`

export const InputContainer = styled.fieldset`
  display: flex;
  flex-direction: column;
`
