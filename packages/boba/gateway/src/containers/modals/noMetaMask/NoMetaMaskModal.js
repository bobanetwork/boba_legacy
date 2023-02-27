import React from 'react';
import { useDispatch } from 'react-redux';

import { Box } from '@mui/material';

import { closeModal } from 'actions/uiAction';
import Button from 'components/button/Button';
import Modal from 'components/modal/Modal';

function NoMetaMaskModal({open}) {

  const dispatch = useDispatch();

  function handleClose() {
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
          href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en"
        >
          Add MetaMask to Chrome
        </Button>
      </Box>
    </Modal>
  )
}

export default React.memo(NoMetaMaskModal);
