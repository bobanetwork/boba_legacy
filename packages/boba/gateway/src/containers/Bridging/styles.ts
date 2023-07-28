import { Button, Typography } from 'components/global'
import styled from 'styled-components'

export const BridginContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 500px;
  margin: 32px auto;
`

export const BridgeWrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid
    ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[400] : colors.gray[300]};
  background: ${({ theme }) => theme.colors.box.background};
  /* Gradient Glass BG Blur */
  backdrop-filter: blur(7.5px);
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
  color: ${({ theme, color }) => color || theme.colors.gray[700]};
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
