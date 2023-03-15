import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { openModal } from 'actions/uiAction';
import { setActiveNetwork } from 'actions/networkAction';
import { setBaseState, setConnect, setConnectBOBA, setConnectETH, setEnableAccount } from 'actions/setupAction';
import { selectActiveNetwork, selectActiveNetworkType, selectNetwork, selectNetworkType } from 'selectors/networkSelector';

import Button from 'components/button/Button';
import { FiberManualRecord } from '@mui/icons-material';
import { selectBaseEnabled, selectLayer } from 'selectors/setupSelector';
import { LAYER } from 'util/constant';

const WalletSwitch = () => {

  const dispatch = useDispatch();
  const network = useSelector(selectNetwork());
  const activeNetwork = useSelector(selectActiveNetwork());
  const networkType = useSelector(selectNetworkType());
  const activeNetworkType = useSelector(selectActiveNetworkType());
  const layer = useSelector(selectLayer());
  const baseEnabled = useSelector(selectBaseEnabled());

  const [ reconnect, setReconnect ] = useState(false);

  const onSwitch = () => {
    dispatch(setActiveNetwork());
    // reset baseState to false to trigger initialization on chain change.
    // and trigger the connect to BOBA & ETH base on current chain.
    dispatch(setBaseState(false));
    dispatch(setEnableAccount(false));
    setReconnect(true);
  }

  useEffect(() => {
    if (!!reconnect && !!baseEnabled) {

      if (layer === LAYER.L1) {
        dispatch(setConnectETH(true));
      } else if (layer === LAYER.L2) {
        dispatch(setConnectBOBA(true));
      } else {
        dispatch(setConnect(true));
      }
      // set reconnect to false to avoid retrigger!
      setReconnect(false);
    }
  }, [ layer, reconnect, baseEnabled, dispatch ]);

  useEffect(() => {
    if (activeNetwork !== network || activeNetworkType !== networkType) {
      dispatch(openModal('switchNetworkModal'))
    }
  }, [activeNetwork, activeNetworkType, network, networkType, dispatch])

  if (activeNetwork === network
    && activeNetworkType === networkType) {
    return null;
  }

  return <>
    <Button
      color="primary"
      size="medium"
      variant="outlined"
      onClick={onSwitch}
      sx={{
        whiteSpace: 'nowrap'
      }}
    >
      Switch to <FiberManualRecord fontSize="small" htmlColor='#BAE21A' /> {` ${network}-${networkType}`}
    </Button>
  </>
}

export default WalletSwitch;
