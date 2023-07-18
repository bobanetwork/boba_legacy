import styled, { css } from 'styled-components'

export const BridgeTabs = styled.div`
  display: flex;
  justify-content: space-between;
  background: ${(props) => props.theme.colors.gray[400]};
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
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
  font-size: ${(props) => props.theme.text.body2};
  background: transparent;
  ${(props) =>
    props.active &&
    css`
      color: ${props.theme.colors.gray[600]};
      background: ${props.theme.colors.green[300]};
    `};
`
