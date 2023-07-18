import styled, { css } from 'styled-components'
import {
  Arrow,
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
        color: ${props.theme.colors.gray[100]};
      `};
  }
  ${Header} {
    border-radius: 20px;
    min-width: 0px;
    padding: 6px 16px;
    gap: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: row;
    align-content: center;
    div {
      font-size: 16px;
      font-family: Roboto;
      font-style: normal;
      font-weight: 500;
      line-height: normal;
    }
    ${Arrow},${Icon} {
      transition: all 0.3s ease;
    }

    ${(props) =>
      props.theme.name === 'light' &&
      css`
        color: ${props.theme.colors.gray[600]};
        border: 2px solid ${props.theme.colors.gray[600]};
        background: none;

        ${Arrow}, ${Icon} {
          fill: ${props.theme.colors.gray[600]};
        }

        &:hover,
        &.active {
          color: ${props.theme.colors.gray[800]};
          border-color: ${props.theme.colors.gray[800]};
          background: none;
          ${Arrow},${Icon} {
            fill: ${props.theme.colors.gray[800]};
          }
        }
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        color: ${props.theme.colors.gray[100]};
        border: 2px solid ${props.theme.colors.gray[200]};
        background: none;
        ${Arrow}, ${Icon} {
          fill: ${props.theme.colors.gray[100]};
        }
        &:hover,
        &.active {
          color: ${props.theme.colors.gray[50]};
          background: none;
          border-color: ${props.theme.colors.green[300]};
          ${Arrow}, ${Icon} {
            fill: ${props.theme.colors.gray[50]};
          }
        }
      `}
  }

  ${IconContainer} {
    width: 16px;
    height: 22px;
    margin: 0px;
  }

  ${Option} {
    display: flex;
    flexdirection: row;
    align-items: center;
    font-size: 12px;
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
  ${Icon} {
    height: 16px;
    width: 16px;
    display: flex;
    align-items: center;
    div {
      height: 18px;
      width: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      max-width: 16px;
      height: auto;
    }
    margin: 0px;
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
    border-radius: 14px;

    ${(props) =>
      props.theme.name === 'light' &&
      css`
        color: ${props.theme.colors.gray[800]};
        border: 1px solid ${props.theme.colors.gray[400]};
        background: ${props.theme.colors.gray[50]};
        box-shadow: 2px 2px 30px rgba(0, 0, 0, 0.15);
        ${Icon} {
          svg {
            fill: ${props.theme.colors.gray[800]};
          }
        }
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        ${Icon} {
          svg {
            fill: ${props.theme.colors.gray[100]};
          }
        }
        color: ${props.theme.colors.gray[100]};
        border: 1px solid ${props.theme.colors.gray[400]};
        background: ${props.theme.colors.gray[500]};
        box-shadow: ${props.theme.backShadow};
      `}
  }

  ${DropdownContent} {
    padding: 0px 10px;
    max-height: 200px;
    display: flex;
    flex-direction: column;
    gap: 5px 0px;
    overflow-y: auto;
    opacity: 1;
    & > ${Option} {
      transition: all 0.25s ease;
      border-radius: 8px;
      padding: 5px;
      box-sizing: border-box;
      background: inherit;
      border: 1px solid rgba(0, 0, 0, 0);
      &:hover,
      &.active {
        background: ${(props) => props.theme.colors.gray[400]};
      }

      ${(props) =>
        props.theme.name === 'light' &&
        css`
          &:hover {
            border: 1px solid ${props.theme.colors.gray[600]};
          }
        `}
      ${(props) =>
        props.theme.name === 'dark' &&
        css`
          &:hover {
            border: 1px solid ${props.theme.colors.gray[100]};
          }
        `};
    }
  }
`
