import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {Button} from 'components/global';
import Modal from 'components/modal/Modal';

import { setActiveNetwork } from 'actions/networkAction';
import { setBaseState, setConnect, setEnableAccount } from 'actions/setupAction';
import { closeModal } from 'actions/uiAction';

import { selectNetwork } from 'selectors';

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
        <Button
          label={`Switch to the ${network} network`}
          onClick={()=>onClick()}
        />
    </Modal>
  )
}

export default React.memo(SwitchNetworkModal);
