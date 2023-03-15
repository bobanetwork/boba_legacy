import React from 'react';
import { useDispatch } from 'react-redux';

import { Box, Typography } from '@mui/material'
import { Circle } from '@mui/icons-material'

import { closeModal } from 'actions/uiAction';
import { setConnect } from 'actions/setupAction';

import Button from 'components/button/Button';
import Modal from 'components/modal/Modal';

function InstallMetaMaskModal({open}) {

  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(closeModal('installMetaMaskModal'));
    dispatch(setConnect(false));
  }

  const handleRefresh = () => {
    handleClose();
    window.location.reload();
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '24px' }} style={{ lineHeight: '1.0em' }}>
        <Box>
          <Typography variant="body2">
            <Circle sx={{ color: '#BAE21A', mr: 1, width: "10px", height: "10px" }} /> Install the MetaMask extension
          </Typography>
          <Typography variant="body3" sx={{ opacity: 0.65 }}>
            We recommend pinning MetaMask to your taskbar for quicker access to your wallet.
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" >
            <Circle sx={{ color: '#BAE21A', mr: 1, width: "10px", height: "10px" }} /> Create New Wallet Or Import Wallet
          </Typography>
          <Typography variant="body3" sx={{ opacity: 0.65 }}>
            Never share your secret phrase with anyone.
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" >
            <Circle sx={{ color: '#BAE21A', mr: 1, width: "10px", height: "10px" }} /> Refresh your browser
          </Typography>
          <Typography variant="body3" sx={{ opacity: 0.65 }}>
            Once you are done with setting up wallet, click below refresh button to load up the extensions and access gateway.
          </Typography>
        </Box>
        <Box display="flex" justifyContent="center">
          <Button
            type="primary"
            variant="contained"
            size="small"
            onClick={() => handleRefresh()}
          >
            Refresh
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default React.memo(InstallMetaMaskModal);
