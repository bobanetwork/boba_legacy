import styled, { css } from 'styled-components'
import {
  Header,
  DropdownContainer,
  IconContainer,
  Option,
  DropdownBody,
  DropdownContent,
  Icon,
} from 'components/global/dropdown/styles'
import { Dropdown } from 'components/global/dropdown/'
import { DefaultIcon } from './styles'

export const DropdownNetwork = styled(Dropdown)`
  ${DropdownContainer} {
    font-size: 16px;
    ${(props) =>
      props.theme.name === 'light' &&
      css`
        color: ${props.theme.colors.gray[800]};
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        color: ${props.theme.colors.gray[50]};
      `};
  }
  ${Header} {
    border-radius: 20px;
    min-width: 0px;
    padding: 8px 16px;
    gap: 8px;
    font-size: 16px;
    ${(props) =>
      props.theme.name === 'light' &&
      css`
        border: 1px solid ${props.theme.colors.gray[400]};
        background: ${props.theme.colors.gray[100]};
        &:hover {
          border-color: 1px solid ${props.theme.colors.gray[500]};
          background: ${props.theme.colors.gray[300]};
        }
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        border: 2px solid ${props.theme.colors.gray[200]};
        background: ${props.theme.colors.gray[500]};
        &:hover {
          border-color: ${props.theme.colors.green[300]};
        }
      `}
  }

  ${IconContainer} {
    border-radius: 50%;
    width: 16px;
    height: 16px;
    margin: 0px;
  }

  ${Option} {
    display: flex;
    flexdirection: row;
    align-items: center;
    font-size: ${(props) => props.theme.text.body2};
    font-weight: bold;
    justify-content: flex-start;
    gap: 8px;
    border-radius: 10px;
    text-align: left;
    color: inherit;
  }

  ${DefaultIcon} {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    ${(props) =>
      props.theme.name === 'light' &&
      css`
        background: ${props.theme.colors.gray[600]};
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        background: ${props.theme.colors.gray[200]};
      `}
  }
  ${Icon}{
    width: 16px;
    height: 16px;
    aligncontent: center;
  }

  ${DropdownBody} {
    min-width: 150px;
    width: 100%;
    top: 45px;
    z-index: 1;
    padding: 10px 0px 10px 0px;
    box-sizing: border-box;
    border: inherit;
    border-top: 0px;
    border-radius: 14px 14px 14px 14px;
    ${(props) =>
      props.theme.name === 'light' &&
      css`
        border: 1px solid ${props.theme.colors.gray[400]};
        background: ${props.theme.colors.gray[100]};
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        border: 1px solid ${props.theme.colors.gray[400]};
        background: ${props.theme.colors.gray[500]};
      `}
  }

  ${DropdownContent}{
      padding: 0px 10px;
      max-height: 200px;
      display: flex;
      flex-direction: column;
      gap: 5px 0px;
      overflow-y: auto;
      & > ${Option} {
        transition: 0.25s all;s
        border-radius: 8px;
        padding: 5px;
        box-sizing: border-box;
        background: inherit;
        ${(props) =>
          props.theme.name === 'light' &&
          css`
            background: ${props.theme.colors.gray[100]};
            &:hover {
              background: ${props.theme.colors.gray[300]};
            }
          `}
        ${(props) =>
          props.theme.name === 'dark' &&
          css`
            border: 1px solid ${props.theme.colors.gray[500]};
            background: ${props.theme.colors.gray[500]};
            &:hover {
              border: 1px solid ${props.theme.colors.gray[100]};
              background: ${props.theme.colors.gray[400]};
            }
          `};
      }
  }
`
