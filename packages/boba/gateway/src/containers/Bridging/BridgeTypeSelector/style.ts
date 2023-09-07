import styled, { css } from 'styled-components'

export const BridgeTabs = styled.div`
  display: flex;
  justify-content: space-between;
  border: 1px solid
    ${({ theme: { name, colors } }) =>
      name === 'light' ? colors.gray[400] : 'transparent'};
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
  font-size: ${(props) => props.theme.text.body1};
  cursor: pointer;
  background: transparent;
  color: ${(props) =>
    props.theme.name === 'light' ? props.theme.colors.gray[600] : 'inherit'};
  box-shadow: 'none';
  ${(props) =>
    props.active &&
    css`
      color: ${props.theme.name === 'light'
        ? props.theme.colors.gray[800]
        : props.theme.colors.gray[600]};
      background: ${props.theme.colors.green[300]};
    `};

  &:nth-child(1) {
    border-radius: 8px 0 0 8px;
  }
  &:nth-child(3) {
    border-radius: 0 8px 8px 0;
  }
`
