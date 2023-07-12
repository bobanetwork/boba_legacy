import React from 'react'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import {
  BridgeAction,
  BridgeContent,
  BridgeHeader,
  BridgeInfo,
  BridgeReceiveWrapper,
  BridgeWrapper,
  ConnectButton,
} from './styles'
import { Button, Heading } from 'components/global'
import { useDispatch } from 'react-redux'
import Tooltip from 'components/tooltip/Tooltip'

interface Props {}

const Bridging = (props: Props) => {
  const dispatch = useDispatch<any>()

  const openSettingModal = () => {
    // TODO: open setting modals;
  }

  return (
    <BridgeWrapper>
      <BridgeContent>
        <BridgeHeader>
          <Heading variant="h2">
            Bridge
            <Tooltip
              title={`Classic Bridge
              A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient.

              Fast Bridge
              A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient.`}
            >
              <HelpOutlineOutlined
                fontSize="small"
                sx={{ cursor: 'pointer', ml: 1 }}
              />
            </Tooltip>
          </Heading>
          <SettingsOutlined
            sx={{ cursor: 'pointer' }}
            onClick={openSettingModal}
          />
        </BridgeHeader>
      </BridgeContent>
      <BridgeReceiveWrapper></BridgeReceiveWrapper>
      <BridgeInfo></BridgeInfo>
      <BridgeAction>
        <ConnectButton
          label={<Heading variant="h3"> Connect Wallet</Heading>}
        />
      </BridgeAction>
    </BridgeWrapper>
  )
}

export default Bridging
