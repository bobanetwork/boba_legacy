import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';

import Button from 'components/button/Button';
import Modal from 'components/modal/Modal';

import { setActiveNetwork } from 'actions/networkAction';
import { closeModal } from 'actions/uiAction';
import { setBaseState, setConnect, setEnableAccount } from 'actions/setupAction';

import { selectNetwork } from 'selectors/networkSelector';

function SwitchNetworkModal({open}) {

  const dispatch = useDispatch();
  const network = useSelector(selectNetwork());

  function onClick() {
    dispatch(setActiveNetwork());
    // reset baseState to false to trigger initialization on chain change.
    // and trigger the connect to BOBA & ETH base on current chain.
    dispatch(setBaseState(false));
    dispatch(setEnableAccount(false));
    dispatch(closeModal('switchNetworkModal'));
  }

  function handleClose() {
    dispatch(setConnect(false));
    dispatch(closeModal('switchNetworkModal'));
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      minHeight="180px"
      title="Switch Network"
      newStyle={true}
    >
      <Box display="flex" alignItems="center" justifyContent="center">
        <Button
          type="primary"
          variant="contained"
          size="large"
          onClick={()=>onClick()}
        >
          Switch to the {network} network
        </Button>
      </Box>
    </Modal>
  )
}

export default React.memo(SwitchNetworkModal);
