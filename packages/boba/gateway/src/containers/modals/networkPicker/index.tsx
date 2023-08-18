import { NetworkPickerModalContainer } from './index.styles'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import React, { FC } from 'react'
import { useDispatch } from 'react-redux'
import { ListLabel } from '../tokenPicker/styles'
import { NetworkList } from 'components/bridge/NetworkPickerList'
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
      <ListLabel> Network Names </ListLabel>

      <NetworkPickerModalContainer>
        <NetworkList />
      </NetworkPickerModalContainer>
    </Modal>
  )
}

export default NetworkPickerModal
