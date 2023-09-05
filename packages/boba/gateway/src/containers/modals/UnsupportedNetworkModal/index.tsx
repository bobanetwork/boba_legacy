import { UnsupportedNetworkModalContainer } from './styles'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import React, { FC } from 'react'
import { useDispatch } from 'react-redux'
import { ListLabel } from '../tokenPicker/styles'
import { NetworkList } from 'components/bridge/NetworkPickerList'
import { Typography } from 'components/global/typography'

interface UnsupportedNetworkModalProps {
  open: boolean
}

const UnsupportedNetworkModal: FC<UnsupportedNetworkModalProps> = ({
  open,
}) => {
  const dispatch = useDispatch<any>()

  const handleClose = () => {
    dispatch(closeModal('UnsupportedNetwork'))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title="Switch Networks"
      transparent={false}
    >
      <Typography variant="body2">
        You are on an unsupported network. Switch networks to begin using this
        application.
      </Typography>
      <ListLabel> Network Names </ListLabel>

      <UnsupportedNetworkModalContainer>
        <NetworkList close={handleClose} />
      </UnsupportedNetworkModalContainer>
    </Modal>
  )
}

export default UnsupportedNetworkModal
