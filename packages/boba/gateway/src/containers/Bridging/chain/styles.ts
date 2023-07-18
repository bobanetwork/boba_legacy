import { Svg, Typography } from 'components/global'
import styled from 'styled-components'

import ArrowDown from 'images/icons/arrowdown.svg'
import Switch from 'images/icons/switchIcon.svg'

export const ChainContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`

export const ChainPickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
`

export const ChainPickerLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${(props) => props.theme.colors.gray[100]};
  flex: 1;
`

export const ChainPicker = styled.div`
  cursor: pointer;
  display: flex;
  padding: 12px 16px;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  border-radius: 14px;
  width: 100%;
  border: 1px solid ${(props) => props.theme.colors.gray[300]};
  background: ${(props) => props.theme.colors.gray[500]};
`

export const ChainIcon = styled.div`
  display: flex;
  align-items: center;
`
export const ChainPickerPlaceHolder = styled.div`
  flex: 1;
`

export const ChainPickerIcon = styled.div`
  justify-self: flex-end;
`
export const DownArrow = styled(Svg).attrs({
  src: ArrowDown,
  fill: '#fff',
})``

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
  border: 1px solid var(--gray-200, #5f5f5f);
  background: var(
    --gradient-glass,
    linear-gradient(
      129deg,
      rgba(48, 48, 48, 0.6) 0%,
      rgba(48, 48, 48, 0.6) 46.35%,
      rgba(37, 37, 37, 0.6) 94.51%
    )
  );

  &:hover {
    background: #b9b9b9;
  }

  > div {
    align-self: stretch;
  }
`
export const SwitchIcon = styled(Svg).attrs({
  src: Switch,
  fill: '#AEDB01',
})`
  display: flex;
`
