import styled, { css } from 'styled-components'
import { Svg } from 'components/global/svg'

export const Label = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
`

export const CheckContainer = styled.div<{ checked: boolean }>`
  position: relative;
  display: flex;
  > div {
    width: 16px;
    height: 16px;
    position: absolute;
    top: 0px;
    left: 2px;
  }
  svg {
    position: absolute;
    top: 2px;
    left: 0px;
    width: 12px;
    height: 12px;
    transition: opacity 0.25s ease;
    opacity: 0;
    fill: ${(props) => props.theme.colors.gray[800]};
  }
  ${(props) =>
    props.checked &&
    `
        svg {
            opacity:1;
        }
  `}
`

export const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  background: transparent;
  appearance: none;
  margin: 0px 10px 0px 0px;
  transition: all 0.25s ease;

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      border: 1px solid ${props.theme.colors.gray[800]};
      svg {
        fill: ${props.theme.colors.gray[800]};
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      border: 1px solid ${props.theme.colors.gray[50]};
      svg {
        fill: ${props.theme.colors.gray[50]};
      }
    `}



  ${(props) =>
    props.checked &&
    `
    border-color:${props.theme.colors.green[300]};
    background:${props.theme.colors.green[300]};
    svg {
        opacity:1;
    }
  `}
`
