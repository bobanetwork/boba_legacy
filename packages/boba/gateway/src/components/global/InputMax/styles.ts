import styled, { css } from 'styled-components'

export const InputContainer = styled.div`
  display: inline-flex;
  min-width: 250px;
  position: relative;
  align-items: center;
`

export const MaxButton = styled.button`
  display: inline-flex;
  position: absolute;
  cursor: pointer;
  right: 10px;
  padding: 4px 6px;
  border-radius: 6px;
  font-family: inherit;
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

export const Input = styled.input`
  width: 100%;
  padding: 15px;
  font-weight: 500;
  line-height: 1;
  appearance: none;
  border-radius: 12px;
  transition: all 0.25s;
  outline: none;
  font-family: inherit;
  font-size: ${(props) => props.theme.text.body1};

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[100]};
      border: 1px solid ${props.theme.colors.gray[400]};
      color: ${props.theme.colors.gray[600]};
      &:hover {
        background: ${props.theme.colors.gray[300]};
      }
      &:focus {
        background: rgba(255, 255, 255, 0);
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[500]};
      border: 1px solid ${props.theme.colors.gray[300]};
      color: ${props.theme.colors.gray[200]};
      &:focus {
        border: 1px solid ${props.theme.colors.green[300]};
      }
    `}
`
