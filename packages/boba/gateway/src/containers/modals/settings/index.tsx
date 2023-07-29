import Modal from 'components/modal/Modal'
import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from 'actions/uiAction'
import {
  SettingSubTitle,
  SettingTitle,
  SettingsAction,
  SettingsItem,
  SettingsText,
  SettingsWrapper,
} from './styles'
import { SwitchButton } from 'components/global'
import { setActiveNetworkType } from 'actions/networkAction'
import { NETWORK_TYPE } from 'util/network/network.util'
import { selectActiveNetworkType, selectBridgeToAddressState } from 'selectors'
import { setBridgeToAddress } from 'actions/bridgeAction'

interface SettingsModalProps {
  open: boolean
}

const SettingsModal: FC<SettingsModalProps> = ({ open }) => {
  const dispatch = useDispatch<any>()
  const activeNetworkType = useSelector(selectActiveNetworkType())
  const bridgeToAddressEnable = useSelector(selectBridgeToAddressState())

  const handleClose = () => {
    dispatch(closeModal('settingsModal'))
  }

  const onChangeNetworkType = (value: boolean) => {
    dispatch(
      setActiveNetworkType({
        networkType: value ? NETWORK_TYPE.TESTNET : NETWORK_TYPE.MAINNET,
      })
    )
  }

  const onChangeDestinationAddress = (value: boolean) => {
    dispatch(setBridgeToAddress(value))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title="Settings"
      transparent={false}
    >
      <SettingsWrapper>
        <SettingsItem>
          <SettingsText>
            <SettingTitle>Use Testnet</SettingTitle>
            <SettingSubTitle>Use bridge on testnets</SettingSubTitle>
          </SettingsText>
          <SettingsAction>
            <SwitchButton
              isActive={activeNetworkType === NETWORK_TYPE.TESTNET}
              onStateChange={(v: boolean) => onChangeNetworkType(v)}
            />
          </SettingsAction>
        </SettingsItem>
        <SettingsItem>
          <SettingsText>
            <SettingTitle>Add Destination Address</SettingTitle>
            <SettingSubTitle>
              Allows you to transfer to a different address
            </SettingSubTitle>
          </SettingsText>
          <SettingsAction>
            <SwitchButton
              isActive={bridgeToAddressEnable}
              onStateChange={onChangeDestinationAddress}
            />
          </SettingsAction>
        </SettingsItem>
        <SettingsItem></SettingsItem>
      </SettingsWrapper>
    </Modal>
  )
}

export default SettingsModal
