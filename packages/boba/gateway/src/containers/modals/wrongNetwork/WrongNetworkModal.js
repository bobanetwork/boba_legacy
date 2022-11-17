import { Box, Typography } from '@mui/material';
import { closeModal } from 'actions/uiAction';

import Modal from 'components/modal/Modal';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectNetwork } from 'selectors/networkSelector';

function WrongNetworkModal({open}) {

  const dispatch = useDispatch();
  const network = useSelector(selectNetwork());

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
          Please connect to the {network} network
        </Typography>
      </Box>
    </Modal>
  )
}

export default React.memo(WrongNetworkModal);
