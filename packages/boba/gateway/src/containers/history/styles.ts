import styled, { css } from 'styled-components'

export const TransationsTableWrapper = styled.div`
  width: 100%;
  overflow-y: auto;
  max-height: 512px;
  &::-webkit-scrollbar {
    width: 24px;
  }
  &::-webkit-scrollbar-track {
    width: 24px;
    padding: 8px;
    margin: 0px;
  }

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[800]};
      &::-webkit-scrollbar-thumb {
        background-color: ${props.theme.colors.gray[500]};
        background-clip: padding-box;
        border: 8px solid transparent;
        border-radius: 12px;
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[50]};

      &::-webkit-scrollbar-thumb {
        background-color: ${props.theme.colors.gray[300]};
        background-clip: padding-box;
        border: 8px solid transparent;
        border-radius: 12px;
      }
    `};
`

export const TransactionContractAdress = styled.div`
  font-size: 12px;
  text-decoration: underline;
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
`

export const TransactionAmount = styled.div`
  font-size: 14px;
  width: 80px;
`

export const Date = styled.div`
  font-family: Roboto;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  width: 168px;
  white-space: nowrap;
`

export const Icon = styled.img`
  width: 32px;
  height: 32px;
`

export const Status = styled.div`
  font-size: 14px;
  width: 88px;
  text-align: left;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[800]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.green[300]};
    `}
`

export const TransactionChain = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 142px;
  gap: 8px;
  text-align: left;
`

export const TransactionChainDetails = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 2px;
`

export const TransactionToken = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  width: 90px;
  text-align: left;
  font-size: 14px;
`

export const Table = styled.div`
  gradient: Linear #303030-#252525;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  width: 100%;

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      border: 1px solid ${props.theme.colors.gray[400]};
      background: ${props.theme.colors.box.background};
      box-shadow: ${props.theme.boxShadow};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      border: 1px solid ${props.theme.colors.gray[300]};
      background: ${props.theme.colors.box.background};
    `}
  @media screen and (max-width: 600px) {
    flexdirection: 'column';
    gap: 10px;
  }
  @media screen and (max-width: 900px) {
    marginbottom: '5px';
  }
`
