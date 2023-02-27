import React from 'react';
import { useDispatch } from 'react-redux';

import { Box } from '@mui/material';

import { closeModal, openModal } from 'actions/uiAction';
import Button from 'components/button/Button';
import Modal from 'components/modal/Modal';
import { MM_EXTENTION_URL } from 'util/constant';

function NoMetaMaskModal({open}) {

  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(closeModal('noMetaMaskModal'));
  }

  const handleAddMetaMask = () => {
    window.open(MM_EXTENTION_URL, '_blank');
    dispatch(openModal('installMetaMaskModal'));
    dispatch(closeModal('noMetaMaskModal'));
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      minHeight="180px"
      title="Don't have MetaMask ?"
      newStyle={true}
    >
      <Box display="flex" alignItems="center" justifyContent="center">
        <Button
          type="primary"
          variant="contained"
          size="large"
          onClick={()=> handleAddMetaMask()}
        >
          Add MetaMask to Chrome
        </Button>
      </Box>
    </Modal>
  )
}

export default React.memo(NoMetaMaskModal);
