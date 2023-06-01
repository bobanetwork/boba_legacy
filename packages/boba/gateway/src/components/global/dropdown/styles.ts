import styled, { css } from 'styled-components'

export const DropdownContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
  min-width: 290px;
  position: relative;
  cursor: pointer;
  border-radius: 14px;
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
`

export const Header = styled.div`
  . position: relative;
  z-index: 2;
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
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px 0px;
  background: inherit;
  position: absolute;
  width: 100%;
  left: 0px;
  top: 50px;
  z-index: 1;
  padding: 10px 15px;
  box-sizing: border-box;
  border: inherit;
  border-radius: 0 0 14px 14px;
`
