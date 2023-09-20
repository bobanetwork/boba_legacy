import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from 'components/global';
import Modal from 'components/modal/Modal';

import { setActiveNetwork } from 'actions/networkAction';
import { setBaseState, setConnect, setEnableAccount } from 'actions/setupAction';
import { closeModal } from 'actions/uiAction';

import { selectActiveNetworkType, selectNetwork } from 'selectors';

const SwitchNetworkModal = ({open}) => {
  const dispatch = useDispatch()
  const network = useSelector(selectNetwork());
  const networkType = useSelector(selectActiveNetworkType())


  const onClick = () => {
    dispatch(setActiveNetwork());
    // reset baseState to false to trigger initialization on chain change.
    // and trigger the connect to BOBA & ETH base on current chain.
    dispatch(setBaseState(false));
    dispatch(setEnableAccount(false));
    dispatch(closeModal('switchNetworkModal'));
  }

  const handleClose = () => {
    dispatch(setConnect(false));
    dispatch(closeModal('switchNetworkModal'));
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title="Switch Network"
      newStyle={true}
    >
      <Button
        label={`Switch to ${network} ${
          networkType === 'Testnet' ? networkType : ''
        } network`}
        onClick={() => onClick()}
      />
    </Modal>
  )
}

export default React.memo(SwitchNetworkModal);
