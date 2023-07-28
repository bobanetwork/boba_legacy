import { SettingsOutlined } from '@mui/icons-material'
import styled from 'styled-components'

export const BridgeHeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`
export const IconWrapper = styled.div<{ inline?: boolean }>`
  padding: 8px;
  height: 32px;
  width: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: ${({ inline }) => (inline ? 'inline-flex' : 'flex')};
  justify-content: center;
  align-items: center;
  &:hover {
    background: ${({ theme: { name, colors } }) =>
      name === 'light' ? colors.gray[400] : colors.gray[300]};
  }
`

export const GearIcon = styled(SettingsOutlined)`
  cursor: pointer;
`
