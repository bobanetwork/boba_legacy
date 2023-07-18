import { Svg, Typography } from 'components/global'
import styled from 'styled-components'
import ArrowDown from 'images/icons/arrowdown.svg'

export const BridgeInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`
export const BridgeInputWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
`
export const TokenSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  min-width: 25%;
`
export const TokenSelectorLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${(props) => props.theme.colors.gray[100]};
`

export const TokenSelectorInput = styled.div`
  cursor: pointer;
  display: flex;
  flex: 1;
  width: 100%;
  padding: 8px 16px;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.colors.gray[300]};
  background: ${(props) => props.theme.colors.gray[500]};
`

export const ReceiveContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`
export const DestinationAddressContainer = styled.div``

export const BridgeInfoContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid var(--green-300-main, #aedb01);
  background: rgba(238, 238, 238, 0.05);

  /* Green Hilight */
  box-shadow: 0px 4px 10px 0px rgba(186, 226, 26, 0.1);
`

export const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`

export const TokenSymbol = styled.div`
  display: flex;
`
export const TokenLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  flex: 1;
  color: ${(props) => props.theme.colors.gray[50]};
`

export const TokenPickerIcon = styled.div`
  justify-self: flex-end;
`
export const DownArrow = styled(Svg).attrs({
  src: ArrowDown,
  fill: '#fff',
})``

export const ReceiveAmount = styled.div`
  display: flex;
  padding: 12px 16px;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.colors.gray[300]};
  color: ${(props) => props.theme.colors.gray[50]};
  font-size: 18px;
  font-weight: 500;
`
