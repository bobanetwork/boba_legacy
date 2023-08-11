import styled, { css } from 'styled-components'
import { mobile, screen, sdesktop } from 'themes/screens'
import { Svg, Typography } from 'components/global'
import Switch from 'assets/images/icons/switchIcon.svg'

import {
  Arrow,
  Header,
  DropdownContainer,
  IconContainer as DropdownIconContianer,
  Option,
  DropdownBody,
  DropdownContent,
  OptionsHeader,
  Icon as DropdownIcon,
} from 'components/global/dropdown/styles'

import { Dropdown } from 'components/global/dropdown/'

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

export const HistoryPageContainer = styled.div`
  margin: 0px auto;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 10px;
  padding-top: 0;
  width: 100%;
  max-width: 1024px;
`

export const TableHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  @media ${screen.mobile} {
    padding: 0px;
  }
`

export const TableFilters = styled.div`
  padding: 20px;
  border-radius: 6px 6px 0px 0px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media ${screen.tablet} {
    margin-bottom: 5px;
    gap: 20px;
    padding: 10px;
  }
  @media ${screen.mobile} {
    gap: 10px;
    margin-bottom: 0px;
    p {
      font-size: 12px;
    }
  }
`

export const DatePickerWrapper = styled.div`
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  white-space: nowrap;
  text-align: center;
  @media ${screen.mobile} {
    display: none;
  }
`

export const MobileDatePickerWrapper = styled.div`
  display: none;
  align-items: center;
  justify-content: space-between;
  white-space: nowrap;
  text-align: center;
  gap: 8px;
  @media ${screen.mobile} {
    display: flex;
  }
`

export const DateInput = styled.button`
  display: flex;
  gap: 8px;
  align-items: center;
  border: 1px solid #545454;
  border-radius: 8px;
  background: #262626;
  padding: 10px 20px;
  color: ${({ theme }) => theme.color};
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
    gap: 0px 5px;
  }
`
export const TransactionsTableWrapper = styled.div`
  width: 100%;
`

export const TransactionsWrapper = styled.div`
  width: 1024px;
  overflow-y: auto;
  max-height: 512px;
  ${sdesktop(css`
    width: 750px;
    gap: 0px 30px;
  `)}
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

export const IncompleteTransactionHash = styled.div`
  font-size: 12px;
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

export const Image = styled.img`
  display: flex;
  align-content: center;
  width: 32px;
  height: 32px;
`

export const SwitchIcon = styled(Svg).attrs({
  src: Switch,
  fill: '#AEDB01',
})`
  display: flex;

  div {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`

export const SwitchChainIcon = styled.div`
  cursor: pointer;
  margin: -12px auto;
  width: 40px;
  height: 40px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  border: 2px solid
    ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[600] : colors.gray[200]};
  background: ${({ theme: { colors } }) => colors.box.background};

  &:hover {
    border-color: ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[600] : colors.gray[100]};
  }

  > div {
    align-self: stretch;
  }
  transition: transform 0.3s ease-in-out;
  &:hover {
    transform: rotate(180deg);
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
    margin-bottom: '5px';
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

export const DropdownNetwork = styled(Dropdown)`
  ${DropdownContainer} {
    font-size: 16px;
    ${(props) =>
      props.theme.name === 'light' &&
      css`
        color: ${props.theme.colors.gray[800]};
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        color: ${props.theme.colors.gray[100]};
      `};
    @media ${screen.mobile} {
      div {
        font-size: 10px;
      }
    }
  }
  ${Header} {
    border-radius: 12px;
    min-width: 0px;
    width: 210px;
    padding: 6px 16px;
    gap: 8px;
    transition: all 0.3s ease;
    display: flex;
    z-index: unset;
    flex-direction: row;
    align-content: center;
    div {
      justify-content: space-between;
      width: 100%;
      font-family: Roboto;
      font-style: normal;
      font-size: 16px;
      font-weight: 500;
      line-height: normal;
      ${DropdownIconContianer} {
        width: 32px;
      }
      ${Arrow} {
        width: 11px;
        @media ${screen.mobile} {
          display: flex;
          align-items: center;
        }
      }
    }
    @media ${screen.mobile} {
      width: 120px;
      padding: 3px 5px;
      white-space: nowrap;
      div {
        font-size: 12px;
      }
    }
  }

  ${Arrow} {
    @media ${screen.mobile} {
      svg {
        width: 6px;
        height: auto;
      }
    }
  }

  ${DropdownIconContianer} {
    width: 16px;
    height: 22px;
    margin: 0px;
    @media ${screen.mobile} {
      width: 10px;
      height: 16px;
      svg {
        width: 10px;
        height: auto;
      }
    }
  }
  ${DropdownIcon} {
    height: 20px;
    width: 20px;
    display: flex;
    align-items: center;
    div {
      height: 20px;
      width: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    margin: 0px;
  }
  ${OptionsHeader} {
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: bold;
    justify-content: flex-start;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0);
    gap: 8px;
    border-radius: 10px;
    text-align: left;
    color: inherit;
    @media ${screen.mobile} {
      font-size: 8px;
    }
  }

  ${Option} {
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: bold;
    justify-content: flex-start;
    gap: 8px;
    border-radius: 10px;
    text-align: left;
    color: inherit;
    @media ${screen.mobile} {
      font-size: 10px;
    }
  }

  ${DefaultIcon} {
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
  }

  ${DropdownBody} {
    min-width: 150px;
    width: 100%;
    top: 45px;
    z-index: 1;
    padding: 10px 0px 10px 0px;
    box-sizing: border-box;
    border: inherit;
    border-top: 0px;
    border-radius: 14px;

    ${(props) =>
      props.theme.name === 'light' &&
      css`
        color: ${props.theme.colors.gray[800]};
        border: 1px solid ${props.theme.colors.gray[400]};
        /* background: ${props.theme.colors.gray[50]}; */
        box-shadow: 2px 2px 30px rgba(0, 0, 0, 0.15);
        ${Icon} {
          svg {
            fill: ${props.theme.colors.gray[800]};
          }
        }
      `}
    ${(props) =>
      props.theme.name === 'dark' &&
      css`
        ${Icon} {
          svg {
            fill: ${props.theme.colors.gray[100]};
          }
        }
        color: ${props.theme.colors.gray[100]};
        border: 1px solid ${props.theme.colors.gray[400]};
        box-shadow: ${props.theme.backShadow};
      `}
  }
  ${DropdownContent} {
    padding: 0px 10px;
    max-height: 200px;
    display: flex;
    flex-direction: column;
    gap: 5px 0px;
    overflow-y: auto;
    opacity: 1;
    & > ${Option} {
      transition: all 0.25s ease;
      border-radius: 8px;
      padding: 5px;
      box-sizing: border-box;
      border: 1px solid rgba(0, 0, 0, 0);
      &:hover {
        background: ${(props) => props.theme.colors.gray[400]};
      }

      ${(props) =>
        props.theme.name === 'light' &&
        css`
          &:hover {
            border: 1px solid ${props.theme.colors.gray[600]};
          }
        `}
      ${(props) =>
        props.theme.name === 'dark' &&
        css`
          &:hover {
            border: 1px solid ${props.theme.colors.gray[100]};
          }
        `};
    }
  }
`

export const TableTransactionsContainer = styled.div`
  width: 100%;
  ${sdesktop(css`
    overflow-x: auto;
  `)}
`

export const DatePickerHeader = styled.div`
  font-size: 14px;
  padding: 8px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ theme: { name, colors } }) =>
    name === 'light'
      ? css`
          background: ${colors?.gray[50]};
          border: 1px solid ${colors?.gray[500]};
        `
      : css`
          background: ${colors?.gray[500]};
          border: 1px solid ${colors?.gray[300]};
        `}

  ${mobile(css`
    height: 30px;
    font-family: roboto;
    width: 130px;
    font-size: 10px;
  `)}
`

export const DatePickerHeadersContainer = styled.div`
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: row;
`

export const DatePickerDropdown = styled.div<{ isRange?: boolean }>`
  transition: 0.25s all;
  position: absolute;
  width: 250px;
  right: 0px;
  top: 40px;
  z-index: 1;
  border-radius: 12px;

  ${({ theme: { colors, name } }) =>
    name === 'light'
      ? css`
          color: ${colors.gray[800]};
          background: ${colors.gray[50]};
          border: 1px solid ${colors.gray[500]};
        `
      : css`
          color: ${colors.gray[50]};
          background: ${colors.gray[500]};
          border: 1px solid ${colors.gray[300]};
          ${(isRange) =>
            !isRange &&
            css`
              .rdp-day_selected {
                border: 1px solid ${colors.gray[100]};
              }
            `}
        `}

  .rdp {
    --rdp-cell-size: 30px;
    --rdp-caption-font-size: 14px;
    --rdp-caption-font-weight: 400;
    --rdp-caption-font-family: roboto;
    --rdp-accent-color: ${(props) => props.theme.colors.gray[400]};
    --rdp-background-color: ${(props) => props.theme.colors.gray[400]};
  }
  ${(props) =>
    props.isRange &&
    props.theme.name === 'light' &&
    css`
      .rdp-day_selected {
        border: 1px solid ${props.theme.colors.gray[600]};
        color: ${props.theme.colors.gray[800]};
      }
    `}
  ${(props) =>
    !props.isRange &&
    props.theme.name === 'dark' &&
    css`
      .rdp-day_selected {
        border: 1px solid ${props.theme.colors.gray[100]};
      }
    `}
    
  ${(props) =>
    !props.isRange &&
    css`
      .rdp-day {
        border-radius: 20%;
      }
    `}
  ${(props) =>
    props.isRange &&
    css`
      .rdp-day {
        border: none !important;
      }
    `}
`

export const DatePickerContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  width: 100%;
  transition: 0.25s all;
  box-sizing: border-box;
  font-family: 'Roboto', sans-serif;
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
