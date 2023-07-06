import styled, { css } from 'styled-components'

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

export const Header = styled.div<{ error: boolean }>`
  box-sizing: border-box;
  position: relative;
  z-index: 2;
  color: inherit;
  border-radius: 14px;
  min-width: 290px;
  padding: 15px;
  transition: 0.25s all;
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
      border: 1px solid ${props.theme.colors.gray[300]};
      background: ${props.theme.colors.gray[500]};
      &:hover {
        border-color: ${props.theme.colors.gray[100]};
      }
    `}
    ${(props) =>
    props.error &&
    ` 
      border-color:${props.theme.colors.red[300]}
    `}
`

export const IconContainer = styled.div`
  border-radius: 50%;
  width: 32px;
  height: 32px;
  margin-right: 8px;
`

export const Option = styled.div`
  display: flex;
  align-items: center;
  font-size: ${(props) => props.theme.text.body2};
  font-weight: bold;
  justify-content: flex-start;
  text-align: left;
  color: inherit;
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
export const Icon = styled.img`
  width: 32px;
  height: 32px;
  margin-right: 8px;
`

export const DropdownBody = styled.div`
  transition: 0.25s all;
  background: inherit;
  position: absolute;
  width: 100%;
  left: 0px;
  top: 50px;
  z-index: 1;
  padding: 25px 5px 10px 0px;
  box-sizing: border-box;
  border: inherit;
  border-top: 0px;
  border-radius: 0 0 14px 14px;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      border: 1px solid ${props.theme.colors.gray[400]};
      background: ${props.theme.colors.gray[100]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      border: 1px solid ${props.theme.colors.gray[300]};
      background: ${props.theme.colors.gray[500]};
    `}
`
export const DropdownContent = styled.div`
  min-height: 80px;
  padding: 0px 10px 0px 10px;
  max-height: 100px;
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
    border-radius: 14px;
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
          border: 1px solid ${props.theme.colors.gray[400]};
          background: ${props.theme.colors.gray[400]};
        }
      `};
  }
`

export const Arrow = styled.img`
  margin-left: auto;
`
