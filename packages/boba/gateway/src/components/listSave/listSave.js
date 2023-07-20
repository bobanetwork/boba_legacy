import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'util/lodash';
import { openAlert, openError } from 'actions/uiAction';
import { formatDate } from 'util/dates';
import Button from 'components/button/Button';
import { Box, Typography } from '@mui/material';
import * as S from './ListSave.styles';
import { withdrawFS_Savings } from 'actions/fixedAction';

const ListSave = ({ stakeInfo }) => {
  const [state, setState] = useState({
    stakeInfo,
  });

  useEffect(() => {
    setState({ stakeInfo });
  }, [stakeInfo]);

  const handleUnstake = async () => {
    const { stakeInfo } = state;

    const withdrawTX = await withdrawFS_Savings(stakeInfo.stakeId);

    if (withdrawTX) {
      openAlert('Your BOBA were unstaked')
    } else {
      openError('Failed to unstake BOBA')
    }
  };

  const timeDeposit_S = state.stakeInfo.depositTimestamp;
  const timeDeposit = formatDate(timeDeposit_S);

  const timeNow_S = Math.round(Date.now() / 1000);
  const duration_S = timeNow_S - timeDeposit_S;
  const earned =
    state.stakeInfo.depositAmount * (0.05 / 365.0) * (duration_S / (24 * 60 * 60));

  const twoWeeks = 14 * 24 * 60 * 60;
  const twoDays = 2 * 24 * 60 * 60;

  const residual_S = duration_S % (twoWeeks + twoDays);
  const timeZero_S = timeNow_S - residual_S;
  const unlocktimeNextBegin = formatDate(timeZero_S + twoWeeks);
  const unlocktimeNextEnd = formatDate(timeZero_S + twoWeeks + twoDays);

  let locked = true;
  if (residual_S > twoWeeks) {
    locked = false
  }

  return (
    <S.StakeListItemContainer>
      <S.StakeItemDetails>
        <Box>
          <Typography variant="body2" sx={{ opacity: 0.65 }}>
            Staked Boba
          </Typography>
          <Typography variant="body2">
            {state.stakeInfo.depositAmount
              ? `${state.stakeInfo.depositAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              : `0`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="body2" sx={{ opacity: 0.65 }}>
            Earned
          </Typography>
          <Typography variant="body2">{earned.toFixed(3)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="body2" sx={{ opacity: 0.65 }}>
            Staked on
          </Typography>
          <Typography variant="body2">{timeDeposit}</Typography>
        </Box>
      </S.StakeItemDetails>
      <S.StakeItemContent>
        <div>
          <Typography variant="body2">Next unstake window:</Typography>
          <Typography variant="body2">
            {unlocktimeNextBegin} - {unlocktimeNextEnd}
          </Typography>
        </div>
      </S.StakeItemContent>
      <S.StakeItemAction>
        <Button onClick={handleUnstake} disable={locked} label="Unstake"/>
      </S.StakeItemAction>
    </S.StakeListItemContainer>
  );
};

const mapStateToProps = (state) => ({
  fixed: state.fixed,
});

export default connect(mapStateToProps)(ListSave);
