import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import moment from 'moment';
import DatePicker from 'react-datepicker';

import { Box, IconButton, Typography, useTheme } from '@mui/material';

import { BigNumber, utils } from 'ethers';

import { openAlert } from 'actions/uiAction';
import { extendLockTime, increaseLockAmount } from 'actions/veBobaAction';
import { selectlayer2Balance } from 'selectors/balanceSelector';
import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector';

import Button from 'components/button/Button';
import CalenderIcon from 'components/icons/CalenderIcon';
import Input from 'components/input/Input';

import { useRef } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { toWei_String } from 'util/amountConvert';
import * as Styles from './ManageLockModal.module.scss';
import * as S from './ManageLockModal.styles';


function IncreaseLock({
  handleClose,
  lockInfo
}) {

  const {
    tokenId,
    expiry
  } = lockInfo

  const dispatch = useDispatch()
  const theme = useTheme()

  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer2 = useSelector(selectlayer2Balance)

  const datePickerRef = useRef()

  const [ amountTo, setAmountTo ] = useState(0);
  const [ expirtyTo, setExpiryTo ] = useState(moment(expiry).format("YYYY-MM-DD"));

  const [ maxBalance, setMaxBalance ] = useState(0);

  useEffect(() => {
    if (expiry) {
      setExpiryTo(moment(expiry).format("YYYY-MM-DD"));
    }
  }, [expiry])

  useEffect(() => {
    if (layer2 && layer2.length > 0) {
      const token = Object.values(layer2).find((t) => t[ 'symbolL2' ] === 'BOBA')
      if (token) {
        let max_BN = BigNumber.from(token.balance.toString())
        setMaxBalance(utils.formatUnits(max_BN, token.decimals))
      }
    }

  }, [ layer2 ]);

  const onExtendTime = async () => {
    const endD = moment(expirtyTo);
    const currD = moment();
    // expiry duration in seconds
    const diffD = endD.diff(currD, 'days') * 24 * 3600;

    const res = await dispatch(extendLockTime({
      tokenId,
      lock_duration: diffD
    }));
    if (res) {
      dispatch(openAlert('Lock time extended.'))
    }

    handleClose();
  }

  const onIncreaseAmount = async () => {

    const res = await dispatch(increaseLockAmount(
      {
        value_Wei_String: toWei_String(amountTo, 18),
        tokenId
      }
    ));

    if (res) {
      dispatch(openAlert('Lock amount increased.'))
    }

    handleClose();
  }

  const openDatePicker = () => {
    let ele = datePickerRef.current;
    ele.setFocus(true);
  }

  return <Box py={2} display="flex" gap={4} flexDirection="column">
    <Box display="flex" flexDirection="column" gap={2}>
      <S.InlineContainer>
        <Typography variant="body2"> BOBA Balance:</Typography>
        <Typography variant="body2"> {maxBalance} </Typography>
      </S.InlineContainer>
      <Input
        value={amountTo}
        type="number"
        maxValue={maxBalance}
        onChange={i => { setAmountTo(i.target.value) }}
        onUseMax={i => { setAmountTo(maxBalance) }}
        newStyle
        disabled={!accountEnabled || layer !== 'L2'}
        variant="standard"
      />
      <Button
        fullWidth={true}
        variant="outlined"
        color="primary"
        size="large"
        onClick={() => onIncreaseAmount()}
      >
        Increase Lock Amount
      </Button>

    </Box>

    <Box display="flex" flexDirection="column" gap={2}>
      <S.InlineContainer>
        <Typography variant="body2"> Lock for</Typography>
      </S.InlineContainer>
      <S.InlineContainer width="100%">
        <Box width="80%">
          <DatePicker
            ref={datePickerRef}
            wrapperClassName={Styles.datePickerInput}
            popperClassName={Styles.popperStyle}
            dateFormat="yyyy-MM-dd"
            selected={new Date(expirtyTo)}
            minDate={new Date(moment(expiry).add(8,'days'))}
            maxDate={new Date(moment().add(1,'year'))}
            onChange={(date) => { setExpiryTo(moment(date).format('yyyy-MM-DD')) }}
            calendarClassName={theme.palette.mode}
          />
        </Box>

        <IconButton
          flex={1}
          onClick={() => {
          openDatePicker()
        }} component="span">
          <CalenderIcon />
        </IconButton>
      </S.InlineContainer>
      <Button
        fullWidth={true}
        variant="outlined"
        color="primary"
        size="large"
        onClick={() => onExtendTime()}
      >
        Extend Lock Time
      </Button>
    </Box>
  </Box>
}

export default IncreaseLock;
