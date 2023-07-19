import styled, { css } from 'styled-components'

export const TabContainer = styled.div`
  display: flex;
`

export const TabItem = styled.div`
  cursor: pointer;
  margin: 0px 8px;
  transition: 0.2s all ease;
  color: ${(props) => props.theme.colors.gray[100]};
  border-radius: 35px;
  padding: 8px 16px;
  border: 2px solid transparent;

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[600]};
      &.active {
        background: ${props.theme.colors.gray[50]};
        border-color: ${props.theme.colors.gray[50]};
        color: ${props.theme.colors.gray[800]};
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      border: 2px solid ${(props) => props.theme.colors.gray[200]};
      &.active {
        border-color: ${(props) => props.theme.colors.green[300]};
        color: white;
      }
    `}

  &:first-of-type {
    margin-left: 0px;
  }
`
