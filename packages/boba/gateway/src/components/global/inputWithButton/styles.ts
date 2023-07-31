import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const InputContainer = styled.div<{ error?: boolean }>`
  width: 100%;
  display: flex;
  padding: 5px 16px;
  justify-content: space-around;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid
    ${({ theme, error }) =>
      error ? theme.colors.red[300] : theme.colors.box.border};
  background: ${(props) => props.theme.colors.box.background};

  ${mobile(css`
    padding: 5px;
  `)}
`

export const Input = styled.input`
  flex: 1;
  padding: 10px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  color: ${(props) => props.theme.color};
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  background: transparent;
  box-shadow: none;
  outline: none;
  border: none;
  font-family: Roboto;
  width: 80%;
`
export const InputActionButton = styled.button<{ disabled?: boolean }>`
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  padding: 4px 6px;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  font-weight: 400;
  border-radius: 6px;
  ${({ theme: { colors, name } }) =>
    name === 'light'
      ? css`
          color: ${colors.gray[600]};
          border: 1px solid ${colors.gray[600]};
          background: ${colors.gray[100]};
          &:hover {
            background: transparent;
          }
        `
      : css`
          color: ${colors.green[300]};
          border: 1px solid ${colors.gray[400]};
          background: transparent;
          &:hover {
            border: 1px solid ${colors.gray[100]};
          }
        `}
`
