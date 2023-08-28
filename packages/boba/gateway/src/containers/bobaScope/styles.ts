import styled, { css } from 'styled-components'
import { mobile, screen, sdesktop } from 'themes/screens'
import { Svg, Typography } from 'components/global'

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

export const TransactionSection = styled.div`
  margin-bottom: 20px;
`

export const Disclaimer = styled.div`
  margin: 5px 10px;
  margin-top: 20px;
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
