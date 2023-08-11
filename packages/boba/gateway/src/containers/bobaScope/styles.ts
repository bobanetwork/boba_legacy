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
