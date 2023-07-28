import styled, { css } from 'styled-components'
import { screen } from 'themes/screens'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Svg, Typography } from 'components/global'

export const HistoryPageContainer = styled.div`
  margin: 0px auto;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 10px;
  padding-top: 0;
  width: 70%;
  min-width: 800px;
  max-width: 1040px;
  @media ${screen.laptop} {
    width: 90%;
    padding: 0px;
  }
  @media ${screen.tablet} {
    width: 90%;
    padding: 0px;
  }
  @media ${screen.mobile} {
    width: 100%;
    padding: 0px;
  }
`

export const TableHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  @media ${screen.mobile} {
    padding: 0px;
    justify-content: flex-start;
  }
`

export const TableFilters = styled.div`
  padding: 20px;
  border-radius: 6px 6px 0px 0px;
  justify-content: space-between;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  @media ${screen.tablet} {
    margin-bottom: 5px;
    gap: 20px;
  }
`

export const NetworkDropdowns = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 16px;
  align-items: center;
  @media ${screen.mobile} {
    font-size: 12px;
  }
`
export const TransactionsTableWrapper = styled.div`
  overflow-x: scroll;
  width: 100%;
`

export const TransactionsWrapper = styled.div`
  width: 100%;
  overflow-y: auto;
  overflow-x: unset;
  max-height: 512px;
  ::-webkit-scrollbar-corner {
    background: none;
  }
  &::-webkit-scrollbar {
    width: 24px;
    height: 24px;
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
export const TransactionDate = styled.div`
  font-family: Roboto;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  text-align: left;
  width: 168px;
  white-space: nowrap;
  @media ${screen.mobile} {
    width: 110px;
    font-size: 10px;
  }
`
export const TransactionDetails = styled.div`
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
export const TransactionChain = styled.div`
  width: 102px;
  height: 16px;
  @media ${screen.mobile} {
    font-size: 10px;
    width: 72px;
    height: 12px;
  }
`

export const TransactionHash = styled.a`
  font-size: 12px;
  text-decoration: underline;
  width: 102px;
  height: 16px;
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
  @media ${screen.mobile} {
    font-size: 8px;
    width: 72px;
    height: 12px;
  }
`
export const TransactionToken = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  width: 90px;
  text-align: left;
  font-size: 14px;
  @media ${screen.mobile} {
    font-size: 10px;
  }
`

export const TransactionAmount = styled.div`
  font-size: 14px;
  width: 80px;
  @media ${screen.mobile} {
    font-size: 10px;
  }
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
  @media ${screen.mobile} {
    font-size: 10px;
  }
`

export const IconContainer = styled.div`
  width: 32px;
  height: 32px;
  direction: flex;
  align-items: center;
  justify-content: center;
  @media ${screen.mobile} {
    width: 24px;
    height: 26px;
    margin: 0px;
  }
`
export const Icon = styled(Svg)`
  display: flex;
  align-content: center;
  width: 32px;
  height: 32px;
  svg {
    width: 32px;
    height: auto;
  }
  @media ${screen.mobile} {
    svg {
      max-width: 24px;
      height: auto;
    }
  }
`

export const Table = styled.div`
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  width: 100%;
  padding-bottom: 10px;

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
  @media ${screen.mobile} {
    flex-direction: 'column';
    padding-bottom: 0px;
    gap: 10px;
  }
  @media ${screen.tablet} {
    marginbottom: '5px';
    padding-bottom: 0px;
  }
`

export const NoHistory = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
  padding: 20px;
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
export const Actions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  white-space: nowrap;
  gap: 0px 20px;
  @media ${screen.mobile} {
    justify-content: flex-start;
    margin-left: 20px;
  }
`

export const DatePickerWrapper = styled(DatePicker)`
  width: 100%;
  position: relative;
  height: 44px;
  margin: 0px;
  padding: 15px 20px;
  border-radius: 12px;
  text-align: center;
  font-size: ${(props) => props.theme.text.body1};
  color: inherit;
  border: 1px solid ${(props) => props.theme.colors.box.border};
  outline: none;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[50]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[500]};
    `}
  @media ${screen.laptop} {
    width: 136px;
  }
  @media ${screen.mobile} {
    min-width: 40px;
    width: 100px;
    height: 30px;
    padding: 3px 4px;
    font-size: 10px;
  }
`

export const SearchInput = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 16px;
  border-radius: 12px;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[50]};
      border: 1px solid ${props.theme.colors.gray[500]};
      color: ${props.theme.colors.gray[600]};
      fill: ${props.theme.colors.gray[600]};
      &:hover {
        border: 1px solid ${props.theme.colors.green[800]};
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: ${props.theme.colors.gray[500]};
      border: 1px solid ${props.theme.colors.gray[300]};
      color: ${props.theme.colors.gray[200]};
      fill: ${props.theme.colors.gray[50]};
      &:hover {
        border: 1px solid ${props.theme.colors.green[300]};
      }
    `}
  
  div {
    padding-left: 5px;
    display: flex;
  }
  svg {
    width: 16px;
    height: auto;
  }
  @media ${screen.mobile} {
    width: 120px;
    height: 30px;
    svg {
      width: 8px;
      height: auto;
    }
  }
`
// TODO: get rid of duplicates
export const Input = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  background: transparent;
  box-shadow: none;
  outline: none;
  border: none;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[600]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[200]};
    `}
  @media ${screen.mobile} {
    width: 120px;
    font-size: 10px;
  }
`

export const DateDescriptions = styled(Typography)`
  @media ${screen.mobile} {
    display: none;
  }
`
export const MobileDateDescriptions = styled(Typography)`
  display: none;
  @media ${screen.mobile} {
    font-size: 12px !important;
    display: flex;
  }
`
