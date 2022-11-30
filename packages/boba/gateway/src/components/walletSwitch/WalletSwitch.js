import { useDispatch, useSelector } from 'react-redux';
import React from 'react';

import { setActiveNetwork } from 'actions/networkAction';
import { setBaseState } from 'actions/setupAction';
import { selectActiveNetwork, selectActiveNetworkType, selectNetwork, selectNetworkType } from 'selectors/networkSelector';

import Button from 'components/button/Button';
import { FiberManualRecord } from '@mui/icons-material';

const WalletSwitch = () => {

  const dispatch = useDispatch();
  const network = useSelector(selectNetwork());
  const activeNetwork = useSelector(selectActiveNetwork());
  const networkType = useSelector(selectNetworkType());
  const activeNetworkType = useSelector(selectActiveNetworkType());

  const onSwitch = () => {
    dispatch(setActiveNetwork());
    // reset baseState to false to trigger initialization on chain change.
    dispatch(setBaseState(false))
  }

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
