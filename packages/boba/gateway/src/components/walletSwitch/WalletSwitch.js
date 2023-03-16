import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setActiveNetwork } from 'actions/networkAction';
import { setBaseState, setConnect, setConnectBOBA, setConnectETH, setEnableAccount } from 'actions/setupAction';
import { selectActiveNetwork, selectActiveNetworkType, selectNetwork, selectNetworkType } from 'selectors/networkSelector';

import Button from 'components/button/Button';
import { FiberManualRecord } from '@mui/icons-material';
import { selectBaseEnabled, selectLayer } from 'selectors/setupSelector';
import { LAYER } from 'util/constant';
import { useTheme } from '@mui/styles';
import { Box, useMediaQuery } from '@mui/material';

const WalletSwitch = ({
  closeDialog /// usable incase of mobile
}) => {

  const dispatch = useDispatch();
  const network = useSelector(selectNetwork());
  const activeNetwork = useSelector(selectActiveNetwork());
  const networkType = useSelector(selectNetworkType());
  const activeNetworkType = useSelector(selectActiveNetworkType());
  const layer = useSelector(selectLayer());
  const baseEnabled = useSelector(selectBaseEnabled());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [ reconnect, setReconnect ] = useState(false);

  const onSwitch = () => {
    dispatch(setActiveNetwork());
    // reset baseState to false to trigger initialization on chain change.
    // and trigger the connect to BOBA & ETH base on current chain.
    dispatch(setBaseState(false));
    dispatch(setEnableAccount(false));
    setReconnect(true);
    if (isMobile) {
      closeDialog()
    }
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

  if (activeNetwork === network
    && activeNetworkType === networkType) {
    return null;
  }

  return <Box p={isMobile ? 2 : 0}>
    <Button
      fullWidth={isMobile}
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
  </Box>
}

export default WalletSwitch;
