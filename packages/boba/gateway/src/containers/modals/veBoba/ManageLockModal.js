import React from 'react'
import { useDispatch } from 'react-redux'
import { Box, Typography } from '@mui/material'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { closeModal } from 'actions/uiAction'

import * as S from './ManageLockModal.style'


const ManageLockModal = ({
  open,

}) => {

  const layer = useSelector(selectLayer())
  const dispatch = useDispatch()

  const handleClose = () => {
    dispatch(closeModal('ManageLock'))
  }


  return <Modal
    open={open}
    onClose={handleClose}
    maxWidth="xs"
    title={'Manage Existing Lock'}
    newStyle={true}
  >

    <Input
      type="number"
      newStyle
      variant="standard"
    />

    <Button
      fullWidth={true}
      variant="contained"
      color="primary"
      size="large"
    >
      Withdraw
    </Button>
    <Button
      fullWidth={true}
      variant="contained"
      color="primary"
      size="large"
    >
      Increase Lock Amount
    </Button>
    <Button
      fullWidth={true}
      variant="contained"
      color="primary"
      size="large"
    >
      Extend Lock Time
    </Button>

  </Modal>
}

export default ManageLockModal;
