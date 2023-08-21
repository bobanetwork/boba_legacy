import styled, { css } from 'styled-components'

export const StyleMenuButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 24px;
  border-radius: 33px;
  gap: 10px;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: #fff;
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: props.theme.colors.gray[400];
    `}

  cursor: pointer;
`
