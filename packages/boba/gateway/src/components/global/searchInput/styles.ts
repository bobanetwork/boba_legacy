import styled, { css } from 'styled-components'
import { screen } from 'themes/screens'

export const SearchInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 16px;
  border-radius: 12px;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[50]};
      border: 1px solid ${props.theme.colors.gray[500]};
      color: ${props.theme.colors.gray[600]};
      fill: ${props.theme.colors.gray[600]};
      &:hover {
        border: 1px solid ${props.theme.colors.green[800]};
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[500]};
      border: 1px solid ${props.theme.colors.gray[300]};
      color: ${props.theme.colors.gray[200]};
      fill: ${props.theme.colors.gray[50]};
      &:hover {
        border: 1px solid ${props.theme.colors.green[300]};
      }
    `}

  div {
    padding-left: 5px;
    display: flex;
  }
  svg {
    width: 16px;
    height: auto;
  }
  @media ${screen.mobile} {
    width: 120px;
    height: 30px;
    svg {
      width: 8px;
      height: auto;
    }
  }
`
// TODO: get rid of duplicates
export const Input = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  background: transparent;
  box-shadow: none;
  outline: none;
  border: none;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[600]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[200]};
    `}
  @media ${screen.mobile} {
    width: 120px;
    font-size: 12px;
  }
`
