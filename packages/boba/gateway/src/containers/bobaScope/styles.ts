import styled, { css } from 'styled-components'

export const HistoryContainer = styled.div`
  border-radius: 8px;
  margin-bottom: 20px;
`

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

export const BobaScopeContainer = styled.div`
  margin: 0px auto;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 10px;
  width: 70%;
`

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
  border-radius: 6px;
`

export const Disclaimer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
  padding: 20px;
  padding-top: 10%;
  font-size: 16px;
  gap: 10px;

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[700]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[100]};
    `}

    svg {
    ${(props) =>
      props.theme.name === 'light' &&
      css`
        fill: ${props.theme.colors.gray[700]};
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        fill: ${props.theme.colors.gray[100]};
      `}
  }
`
