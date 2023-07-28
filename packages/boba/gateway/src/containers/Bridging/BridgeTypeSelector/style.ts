import styled, { css } from 'styled-components'

export const BridgeTabs = styled.div`
  display: flex;
  justify-content: space-between;
  border: 1px solid
    ${({ theme: { name, colors } }) =>
      name === 'light' ? colors.gray[400] : 'transperant'};
  background: ${({ theme: { name, colors } }) =>
    name === 'light' ? colors.gray[100] : colors.gray[500]};
  border-radius: 8px;
  padding: 5px;
  width: 100%;
`
export const BridgeTabItem = styled.div<{
  active?: boolean
}>`
  width: 100%;
  padding: 8px 50px;
  text-align: center;
  font-family: Montserrat;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  border-radius: 8px;
  font-size: ${(props) => props.theme.text.body1};
  cursor: pointer;
  background: transparent;
  color: ${(props) =>
    props.theme.name === 'light' ? props.theme.colors.gray[600] : 'inherit'};
  box-shadow: ${({ theme: { name } }) =>
    name === 'light'
      ? '0px 2px 4px 0px rgba(0, 0, 0, 0.10)'
      : '0px 4px 10px 0px rgba(186, 226, 26, 0.1)'};
  ${(props) =>
    props.active &&
    css`
      color: ${props.theme.name === 'light'
        ? props.theme.colors.gray[800]
        : props.theme.colors.gray[600]};
      background: ${props.theme.colors.green[300]};
    `};
`
