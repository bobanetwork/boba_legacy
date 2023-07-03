import styled, { css } from 'styled-components'

export const DropdownContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: 0.25s all;
  box-sizing: border-box;
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
`

export const Header = styled.div`
  box-sizing: border-box;
  position: relative;
  z-index: 2;
  color: inherit;
  border-radius: 20px;
  // min-width: 167px;
  padding: 8px 16px;
  gap: 8px;
  transition: 0.25s all;
  font-size: 16px;
  align-items: center;
  justify-content: center;
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
`

export const IconContainer = styled.div`
  border-radius: 50%;
  width: 16px;
  height: 16px;
  // margin-right: 8px;
`

export const Option = styled.div`
  display: flex;
  align-items: center;
  font-size: ${(props) => props.theme.text.body2};
  font-weight: bold;
  justify-content: center;
  gap: 8px;
  text-align: left;
  color: inherit;
`

export const DefaultIcon = styled.div`
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
`
export const Icon = styled.img`
  width: 16px;
  height: 16px;
  // margin-right: 8px;
`

export const DropdownBody = styled.div`
  padding-top: 10px;
  min-width: 150px;
  transition: 0.25s all;
  background: inherit;
  position: absolute;
  width: 100%;
  left: 0px;
  top: 40px;
  z-index: 1;
  padding: 25px 0px 10px 0px;
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
      border: 1px solid ${props.theme.colors.gray[300]};
      background: ${props.theme.colors.gray[500]};
    `}
`
export const DropdownContent = styled.div`
  // min-height: 80px;
  padding: 0px 10px;

  max-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 5px 0px;
  overflow-y: auto;
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
