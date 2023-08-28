import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import { openModal } from 'actions/uiAction'
import { Heading } from 'components/global'
import Tooltip from 'components/tooltip/Tooltip'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useTheme } from 'styled-components'
import { BridgeHeaderWrapper, GearIcon, IconWrapper } from './styles'

type Props = {}

const BridgeHeader = (props: Props) => {
  const dispatch = useDispatch<any>()
  const theme: any = useTheme()

  const iconColor =
    theme.name === 'light' ? theme.colors.gray[600] : theme.colors.gray[100]

  const openSettingModal = () => {
    dispatch(openModal('settingsModal'))
  }

  return (
    <BridgeHeaderWrapper>
      <Heading variant="h2">
        Bridge
        <Tooltip
          title={`
                Classic Bridge:
                Although this option is always available, it takes 7 days to receive your funds when withdrawing from L2 to L1.
                Fast Bridge:
                A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient.`}
        >
          <IconWrapper inline={true} style={{ marginLeft: '5px' }}>
            <HelpOutlineOutlined
              fontSize="small"
              sx={{ cursor: 'pointer', color: iconColor }}
            />
          </IconWrapper>
        </Tooltip>
      </Heading>
      <IconWrapper>
        <GearIcon
          sx={{ color: iconColor }}
          onClick={openSettingModal}
          id="settings"
        />
      </IconWrapper>
    </BridgeHeaderWrapper>
  )
}

export default BridgeHeader
