import { Box, CircularProgress, Typography } from '@mui/material';
import { closeModal } from 'actions/uiAction';
import Modal from 'components/modal/Modal';
import React from 'react'
import { useDispatch } from 'react-redux';

function TransferPendingModal({open}) {

  const dispatch = useDispatch();

  function handleClose () {
    dispatch(closeModal('transferPending'));
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      minHeight="300px"
      title="Transaction Pending"
      newStyle={true}
    >
      <Box display="flex" alignItems="center" flexDirection="column" justifyContent="space-around" gap={2}>
        <CircularProgress size="100px" color="primary" />
        <Typography variant='body2'>Waiting for confirmation from MetaMask</Typography>
      </Box>
    </Modal>
  )
}

export default React.memo(TransferPendingModal);
