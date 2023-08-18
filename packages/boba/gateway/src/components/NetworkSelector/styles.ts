import styled, { css } from 'styled-components'
import { Svg } from 'components/global/svg'

export const NetworkContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 24px;
  border-radius: 33px;
  gap: 10px;
  user-select: none;

  cursor: pointer;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: #fff;
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[400]};
    `}
`

export const Arrow = styled(Svg)`
  display: flex;
  > div {
    display: flex;
    height: auto;
    padding: 5px 0px;
  }
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      svg {
        fill: ${props.theme.colors.gray[800]};
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      svg {
        fill: ${props.theme.colors.gray[50]};
      }
    `}
`

export const Dropdown = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 50px;
  border-radius: inherit;
  background: inherit;
  gap: 10px;
`
