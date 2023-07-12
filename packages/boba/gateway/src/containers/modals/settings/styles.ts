import { Typography } from 'components/global'
import styled from 'styled-components'

export const SettingsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
`

export const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`
export const SettingsText = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  flex: 1;
`
export const SettingsAction = styled.div`
  display: flex;
  justify-content: space-between;
`
export const SettingSubTitle = styled(Typography).attrs({
  variant: 'subtitle',
})`
  color: ${(props) => props.theme.colors.gray[100]};
`
export const SettingTitle = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${(props) => props.theme.colors.gray[50]};
`
