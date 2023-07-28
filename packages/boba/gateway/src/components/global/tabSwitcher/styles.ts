import styled, { css } from 'styled-components'

export const TabSwitcherContainer = styled.div`
  display: flex;
  padding: 4px;
  gap: 0px 15px;
  border-radius: 8px;
  ${({ theme: { colors, name } }) =>
    name === 'light'
      ? css`
          background: ${colors.gray[50]};
        `
      : css`
          background: ${colors.gray[500]};
        `}
`

export const Tab = styled.div<{ active: boolean }>`
  padding: 8px 24px;
  border-radius: 8px;
  cursor: pointer;
  ${(props) =>
    props.active &&
    `
        color:${props.theme.colors.gray[800]};
        background:${props.theme.colors.green[300]}
    `}
`
