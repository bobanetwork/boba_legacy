import React, { useState } from 'react'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import {
  BridgeAction,
  BridgeContent,
  BridgeHeader,
  BridgeInfo,
  BridgeReceiveWrapper,
  BridgeTabItem,
  BridgeTabs,
  BridgeWrapper,
  ConnectButton,
} from './styles'
import { Heading } from 'components/global'
import { useDispatch, useSelector } from 'react-redux'
import Tooltip from 'components/tooltip/Tooltip'
import { openModal } from 'actions/uiAction'
import { selectAccountEnabled } from 'selectors'
import { setConnect } from 'actions/setupAction'
import Chains from './chain'

interface Props {}

enum BRIDGE_TYPE {
  CLASSIC,
  FAST,
}

const Bridging = (props: Props) => {
  const dispatch = useDispatch<any>()
  const accountEnabled = useSelector<any>(selectAccountEnabled())

  const [bridgeType, setbridgeType] = useState(BRIDGE_TYPE.CLASSIC)

  const openSettingModal = () => {
    dispatch(openModal('settingsModal'))
  }

  const onConnect = () => {
    dispatch(setConnect(true))
  }

  return (
    <BridgeWrapper>
      <BridgeContent>
        <BridgeHeader>
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
        </BridgeHeader>
        <BridgeTabs>
          <BridgeTabItem
            active={bridgeType === BRIDGE_TYPE.CLASSIC}
            onClick={() => setbridgeType(BRIDGE_TYPE.CLASSIC)}
          >
            Classic
          </BridgeTabItem>
          <BridgeTabItem
            active={bridgeType === BRIDGE_TYPE.FAST}
            onClick={() => setbridgeType(BRIDGE_TYPE.FAST)}
          >
            Fast
          </BridgeTabItem>
        </BridgeTabs>
        <Chains />
      </BridgeContent>
      <BridgeReceiveWrapper></BridgeReceiveWrapper>
      <BridgeInfo></BridgeInfo>
      <BridgeAction>
        {!accountEnabled ? (
          <ConnectButton
            onClick={onConnect}
            label={<Heading variant="h3"> Connect Wallet</Heading>}
          />
        ) : (
          <ConnectButton label={<Heading variant="h3">Bridge</Heading>} />
        )}
      </BridgeAction>
    </BridgeWrapper>
  )
}

export default Bridging
