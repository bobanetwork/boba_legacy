import styled, { css } from 'styled-components'

export const InputContainer = styled.div`
  width: 100%;
  display: flex;
  padding: 5px 16px;
  justify-content: space-around;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.colors.gray[300]};
  background: ${(props) => props.theme.colors.gray[500]};
`

export const Input = styled.input`
  flex: 1;
  padding: 10px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  color: ${(props) => props.theme.colors.gray[50]};
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  background: transparent;
  box-shadow: none;
  outline: none;
  border: none;
`
export const InputActionButton = styled.button<{ disabled?: boolean }>`
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  padding: 4px 6px;
  align-items: flex-start;
  gap: 10px;
  color: ${(props) => props.theme.colors.green[300]};
  font-size: 12px;
  font-weight: 400;
  border-radius: 6px;
  border: 1px solid ${(props) => props.theme.colors.gray[400]};
  background: transparent;
`
