import { Box, Typography } from '@mui/material';
import { closeModal } from 'actions/uiAction';

import Modal from 'components/modal/Modal';
import React from 'react';
import { useDispatch } from 'react-redux';

// network service
import networkService from 'services/networkService';

function WrongNetworkModal({open}) {

  const dispatch = useDispatch();

  function handleClose () {
    dispatch(closeModal('wrongNetworkModal'));
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      minHeight="200px"
      title="Wrong Network"
      newStyle={true}
    >
      <Box display="flex" alignItems="center" justifyContent="center">
        <Typography variant='body2'>
          Please connect to the {networkService.L1ChainAsset.l2Name} network
        </Typography>
      </Box>
    </Modal>
  )
}

export default React.memo(WrongNetworkModal);
