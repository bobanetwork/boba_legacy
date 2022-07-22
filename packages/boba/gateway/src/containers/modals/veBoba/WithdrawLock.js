import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, Typography } from '@mui/material';

import { openAlert } from 'actions/uiAction';
import { withdrawLock } from 'actions/veBobaAction';

import Button from 'components/button/Button';

import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg';

import * as S from './ManageLockModal.styles';
import moment from 'moment';

function WithdrawLock({
  handleClose,
  lockInfo
}) {

  const {
    tokenId,
    lockedAmount,
    expiry
  } = lockInfo

  const dispatch = useDispatch()

  const onWithdraw = async (tokenId) => {
    const res = await dispatch(withdrawLock({tokenId}));
    if (res) {
      dispatch(openAlert('Lock Withdraw successful.'))
    }

    handleClose(true);
  }

  return <Box p={2} display="flex" gap={4} flexDirection="column">
    <Box display="flex" justifyContent="flex-start" gap={2}>
      <S.ThumbnailContainer px={2} py={1}>
        <img src={BobaNFTGlass} alt="glass" />
      </S.ThumbnailContainer>
      <Box display="flex" flexDirection="column" justifyContent="space-around">
        <Typography variant="body3" sx={{ opacity: 0.7 }}>
          NFT ID:
        </Typography>
        <Typography variant="h3">
          #{tokenId}
        </Typography>
      </Box>
    </Box>
    <Box display="flex" flexDirection="column" justifyContent="space-around" alignItems="flex-start">
      <Typography variant="body3" sx={{ opacity: 0.7 }}>
        Lock Expiry :
      </Typography>
      <Typography variant="h3">
        {moment(expiry).format('yyyy-MM-DD')}
      </Typography>
    </Box>
    <Box display="flex" flexDirection="column" justifyContent="space-around" alignItems="flex-start">
      <Typography variant="body3" sx={{ opacity: 0.7 }}>
        Available Withdraw Amount
      </Typography>
      <Typography variant="h3">
        {lockedAmount} Boba
      </Typography>
    </Box>
    <Button
      fullWidth={true}
      variant="outlined"
      color="primary"
      size="large"
      onClick={() => onWithdraw(tokenId)}
    >
      Withdraw
    </Button>
  </Box>
}

export default WithdrawLock;
