import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';

import Button from 'components/button/Button';
import Modal from 'components/modal/Modal';

import { restTokenList } from 'actions/tokenAction';
import { setConnect, setConnectETH } from 'actions/setupAction';
import { closeModal } from 'actions/uiAction';

import { selectNetwork } from 'selectors';

function WrongNetworkModal({open}) {

  const dispatch = useDispatch();
  const network = useSelector(selectNetwork());

  useEffect(() => {
    if (open){
      dispatch(restTokenList())
    }
  }, [dispatch, open])


  function handleClose() {
    dispatch(setConnect(false));
    dispatch(closeModal('wrongNetworkModal'));
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      minHeight="180px"
      title="Wrong Network"
      newStyle={true}
    >
      <Box display="flex" alignItems="center" justifyContent="center">
        <Button
          type="primary"
          variant="contained"
          size="large"
          onClick={()=>dispatch(setConnectETH(true))}
        >
          Connect to the {network} network
        </Button>
      </Box>
    </Modal>
  )
}

export default React.memo(WrongNetworkModal);
