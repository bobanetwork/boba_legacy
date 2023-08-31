import styled, { css } from 'styled-components'
import { Svg } from 'components/global/svg'
import { mobile } from 'themes/screens'
import { ChainLabelContainer } from 'components/bridge/ChainLabel/styles'

export const NetworkContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 24px;
  border-radius: 33px;
  gap: 10px;
  user-select: none;
  height: 40px;
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

    ${mobile(css`
    ${ChainLabelContainer} {
      font-size: 0px;
      gap: 0px;
    }
  `)}
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
  top: 65px;
  border-radius: 8px;
  background: inherit;
  gap: 5px;
  padding: 10px 15px;
  img,
  svg {
    max-width: 24px;
    width: 100%;
    height: 100%;
    max-height: 34px;
  }
  > div {
    > div {
      padding: 5px 10px;
    }
  }
  ${mobile(css`
    width: 100%;
    position: fixed;
    left: 0px;
    padding: 25px;
    border-radius: 0px;
    top: 72px;
  `)}
`
