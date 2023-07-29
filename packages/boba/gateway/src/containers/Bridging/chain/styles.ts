import { Svg, Typography } from 'components/global'
import styled from 'styled-components'

import ArrowDown from 'assets/images/icons/arrowdown.svg'
import Switch from 'assets/images/icons/switchIcon.svg'

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
  border: 1px solid
    ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[400] : colors.gray[300]};
  background: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[100] : colors.gray[500]};
`

export const ChainIcon = styled.div`
  display: flex;
  align-items: center;
`
export const ChainPickerPlaceHolder = styled(Typography).attrs({
  variant: 'body1',
})`
  flex: 1;
`

export const ChainPickerIcon = styled.div`
  justify-self: flex-end;
`
export const DownArrow = styled(Svg).attrs({
  src: ArrowDown,
  fill: 'current',
})`
  fill: ${({ theme }: { theme: any }) =>
    theme.name === 'light' ? theme.colors.gray[600] : '#fff'};
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
  border: 1px solid ${(props) => props.theme.colors.box.border};
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
export const SwitchIcon = styled(Svg).attrs({
  src: Switch,
  fill: '#AEDB01',
})`
  display: flex;
`

export const SectionLabel = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[700] : colors.gray[100]};
`
