import styled, { css } from 'styled-components'

export const Line = styled.div`
  display: block;
  margin: 25px auto;
  width: 95%;
  height: 1px;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[500]};
    `}

  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[200]};
    `}
`
