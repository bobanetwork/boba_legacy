import styled, { css } from 'styled-components'
import { Svg } from 'components/global/svg'
import { screen } from 'themes/screens'

export const DropdownContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: 0.25s all;
  box-sizing: border-box;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[800]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[50]};
    `}
`

export const Header = styled.div<{ error: boolean; isOpen: boolean }>`
  box-sizing: border-box;
  position: relative;
  color: inherit;
  border-radius: 37px;
  transition: all 0.3s ease;
  background: none;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      border: 2px solid ${props.theme.colors.gray[600]};
      svg {
        fill: ${props.theme.colors.gray[600]};
      }
      &:hover {
        border-color: ${props.theme.colors.gray[800]};
        svg {
          fill: ${props.theme.colors.gray[800]};
        }
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      border: 2px solid ${props.theme.colors.gray[200]};
      svg {
        fill: ${props.theme.colors.gray[100]};
      }
      &:hover {
        color: ${props.theme.colors.gray[50]};
        border-color: ${props.theme.colors.green[300]};
        svg {
          fill: ${props.theme.colors.gray[50]};
        }
      }
    `}
    ${(props) =>
    props.error &&
    `
      border-color:${props.theme.colors.red[300]}
    `}
  ${({ isOpen, theme }) =>
    isOpen &&
    css`
      color: ${theme.name === 'light' ? 'initial' : theme.colors.gray[50]};
      border-color: ${theme.name === 'light'
        ? theme.colors.gray[800]
        : theme.colors.green[300]};
      svg {
        fill: ${theme.name === 'light'
          ? theme.colors.gray[800]
          : theme.colors.gray[50]};
      }
    `}
`

export const IconContainer = styled.div`
  width: auto;
  height: auto;
  display: flex;
  padding: 10px 11px;
  align-items: center;
  justify-content: center;
  @media ${screen.mobile} {
    width: 20px;
    height: 20px;
  }
`

export const Option = styled.div<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  font-size: ${(props) => props.theme.text.body2};
  font-weight: bold;
  justify-content: flex-start;
  text-align: left;
  background: inherit;
  color: inherit;
  ${({ isSelected, theme }) =>
    isSelected &&
    css`
      background: ${theme.colors.gray[400]};
    `}
  @media ${screen.mobile} {
    font-size: 10px;
  }
`

export const DefaultIcon = styled.div`
  width: 32px;
  height: 32px;
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
`
export const Icon = styled(Svg)`
  height: 16px;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    max-width: 32px;
    min-width: 10px;
    height: auto;
  }
`

export const DropdownBody = styled.div`
  transition: 0.25s all;
  background: inherit;
  position: absolute;
  width: 100%;
  min-width: 139px;
  right: 0px;
  top: 45px;
  z-index: 1;
  padding: 8px 8px 8px 8px;
  box-sizing: border-box;
  border: inherit;
  border-top: 0px;
  border-radius: 14px;
  box-shadow: ${(props) => props.theme.backShadow};
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[800]};
      border: 1px solid ${props.theme.colors.gray[400]};
      background: ${props.theme.colors.gray[50]};
      //   box-shadow: 2px 2px 30px rgba(0, 0, 0, 0.15);
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[100]};
      border: 1px solid ${props.theme.colors.gray[400]};
      background: ${props.theme.colors.gray[500]};
    `}
`
export const DropdownContent = styled.div`
  min-height: 80px;
  max-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 5px 0px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 4px;
    margin-right: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #555;
  }

  & > ${Option} {
    transition: 0.25s all;
    border-radius: 8px;
    padding: 8px;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0);
    &:hover {
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
`
