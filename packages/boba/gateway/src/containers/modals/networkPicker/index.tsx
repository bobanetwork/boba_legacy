import {
  NetworkPickerModalContainer,
  NetworkPickerList,
  NetworkItem,
  NetworkIcon,
  NetworkLabel,
} from './index.styles'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import React, { FC } from 'react'
import { useDispatch } from 'react-redux'

interface NetworkPickerModalProps {
  open: boolean
}

const NetworkPickerModal: FC<NetworkPickerModalProps> = ({ open }) => {
  const dispatch = useDispatch<any>()

  const handleClose = () => {
    dispatch(closeModal('networkPicker'))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title="Select Network"
      transparent={false}
    >
      <NetworkPickerModalContainer>
        <NetworkPickerList>
          <NetworkItem>
            <NetworkIcon></NetworkIcon>
            <NetworkLabel>Ethereum Mainnet</NetworkLabel>
          </NetworkItem>
          <NetworkItem>
            <NetworkIcon></NetworkIcon>
            <NetworkLabel>BNB Chain</NetworkLabel>
          </NetworkItem>
          <NetworkItem>
            <NetworkIcon></NetworkIcon>
            <NetworkLabel>Boba Network</NetworkLabel>
          </NetworkItem>
          <NetworkItem>
            <NetworkIcon></NetworkIcon>
            <NetworkLabel>Boba BNB chain</NetworkLabel>
          </NetworkItem>
        </NetworkPickerList>
      </NetworkPickerModalContainer>
    </Modal>
  )
}

export default NetworkPickerModal
