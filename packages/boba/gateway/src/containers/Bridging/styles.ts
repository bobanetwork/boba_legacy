import { Button, Typography } from 'components/global'
import styled from 'styled-components'

export const BridgeWrapper = styled.div`
  margin: 32px auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 500px;
  border-radius: 12px;
  border: 1px solid var(--gray-300, #545454);
  background: var(
    --gradient-glass,
    linear-gradient(
      129deg,
      rgba(48, 48, 48, 0.6) 0%,
      rgba(48, 48, 48, 0.6) 46.35%,
      rgba(37, 37, 37, 0.6) 94.51%
    )
  );
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

export const ConnectButton = styled(Button).attrs({
  style: {
    width: '100%',
  },
})``

export const Label = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${(props) => props.theme.colors.gray[100]};
`
