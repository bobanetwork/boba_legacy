import { Button, Typography } from 'components/global'
import styled, { css } from 'styled-components'
import { mobile } from 'themes/screens'

export const BridginContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 500px;
  margin: 32px auto;

  ${mobile(css`
    max-width: 360px;
    margin: 24px auto;
  `)}
`

export const BridgeWrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid
    ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[400] : colors.gray[300]};
  background: ${({ theme }) => theme.colors.box.background};
  /* Gradient Glass BG Blur */
  backdrop-filter: blur(7.5px);

  ${mobile(css`
    padding: 24px 16px;
  `)}
`

export const BridgeContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: space-around;
  align-items: flex-start;
`

export const BridgeReceiveWrapper = styled.div``
export const BridgeInfo = styled.div``
export const BridgeAction = styled.div`
  width: 100%;
  display: flex;
  justify-content: around;
  align-items: center;
`

export const BridgeActionButton = styled(Button).attrs({
  style: {
    width: '100%',
  },
})``

export const Label = styled(Typography).attrs({
  variant: 'body3',
})`
  font-weight: 400;
  line-height: normal;
  color: ${({ theme, color }) =>
    color
      ? color
      : theme.name === 'light'
      ? theme.colors.gray[700]
      : theme.colors.gray[100]};
`

export const BridgeItem = styled.a`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  color: ${(props) => props.theme.color};
  text-decoration: none;
  &:hover {
    background: ${(props) => props.theme.colors.gray[400]};
  }
`
export const BridgeIcon = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 200px;
  background: #fff;
`
export const BridgeLabel = styled(Typography).attrs({
  variant: 'title',
})`
  flex: 1;
  line-height: normal;
  text-transform: capitalize;
`
