import { InprogressContainer, MutedText, ProgressLoader } from './index.styles'
import { closeModal } from 'actions/uiAction'
import { Heading, Typography } from 'components/global'
import Modal from 'components/modal/Modal'
import React, { FC } from 'react'
import { useDispatch } from 'react-redux'

interface Props {
  open: boolean
}

const BridgeInProgressModal: FC<Props> = ({ open }) => {
  const dispatch = useDispatch<any>()

  const handleClose = () => {
    dispatch(closeModal('bridgeInProgress'))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title=""
      transparent={false}
    >
      <InprogressContainer>
        <ProgressLoader />
        <Heading variant="h1">Bridging...</Heading>
        <Typography variant="head">Current blocks : 3/64</Typography>
        <MutedText>Please wait a moment</MutedText>
      </InprogressContainer>
    </Modal>
  )
}

export default BridgeInProgressModal
