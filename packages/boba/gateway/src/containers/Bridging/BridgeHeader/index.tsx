import React from 'react'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import Tooltip from 'components/tooltip/Tooltip'
import { BridgeHeaderWrapper } from './styles'
import { Heading } from 'components/global'
import { useDispatch } from 'react-redux'
import { openModal } from 'actions/uiAction'

type Props = {}

const BridgeHeader = (props: Props) => {
  const dispatch = useDispatch<any>()

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
                This option is always available but has a 7 day delay before receiving your funds.
                Fast Bridge:
                A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient.`}
        >
          <HelpOutlineOutlined
            fontSize="small"
            sx={{ cursor: 'pointer', ml: 1, color: '#A8A8A8' }}
          />
        </Tooltip>
      </Heading>
      <SettingsOutlined
        sx={{ cursor: 'pointer', color: '#A8A8A8' }}
        onClick={openSettingModal}
      />
    </BridgeHeaderWrapper>
  )
}

export default BridgeHeader
