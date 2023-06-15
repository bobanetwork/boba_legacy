import styled, { css } from 'styled-components'

export const HeaderWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 64px;
  gap: 10px;
  justify-content: space-around;
  align-items: center;
  padding: '20px';

  @media (max-width: 980px) {
    justify-content: space-between;
    padding: 20px 0;
  }
`

export const HeaderActionButton = styled.div`
  gap: 10px;
  display: flex;
  justify-content: space-around;
  align-items: center;
`

export const DrawerHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 20px 24px;
`

export const HeaderDivider = styled.div`
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[700]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[800]};
    `}
  box-sizing: border-box;
  box-shadow: ${(props) => props.theme.boxShadow};
  width: 100%;
`

export const WrapperCloseIcon = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const StyleDrawer = styled.div`
  height: 100%;

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[50]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[800]};
    `}
`
