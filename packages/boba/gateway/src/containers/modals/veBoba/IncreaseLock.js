import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, Typography } from '@mui/material';

import { openAlert } from 'actions/uiAction';
import { extendLockTime, increaseLockAmount, withdrawLock } from 'actions/veBobaAction';

import Button from 'components/button/Button';

import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg';

import * as S from './ManageLockModal.styles';
import moment from 'moment';
import Input from 'components/input/Input';

function IncreaseLock({
  handleClose,
  lockInfo
}) {

  const {
    tokenId,
    balance,
    lockAmount,
    expiry
  } = lockInfo

  const dispatch = useDispatch()

  const [ amountTo, setAmountTo ] = useState(0);
  const [ expirtyTo, setExpiryTo ] = useState(0);

  const onExtendTime = async ({ payload }) => {
    const res = await dispatch(extendLockTime());
    if (res) {
      dispatch(openAlert('Lock time extended.'))
    }

    handleClose();
  }

  const onIncreaseAmount = async ({ payload }) => {
    const res = await dispatch(increaseLockAmount());
    if (res) {
      dispatch(openAlert('Lock amount increased.'))
    }

    handleClose();
  }

  return <Box p={2} display="flex" gap={4} flexDirection="column">
    <Box display="flex" flexDirection="column" py={2} px={4} gap={2}>
      <S.InlineContainer>
        <Typography variant="body2"> BOBA Balance:</Typography>
        <Typography variant="body2"> {maxBalance} </Typography>
      </S.InlineContainer>
      <Input
        value={value}
        type="number"
        maxValue={maxBalance}
        onChange={i => { setValue(i.target.value) }}
        onUseMax={i => { setValue(maxBalance) }}
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

    <Box display="flex" flexDirection="column" justifyContent="space-around" alignItems="flex-start">
      <S.InlineContainer>
        <Typography variant="body2"> Lock for</Typography>
      </S.InlineContainer>
      <S.InlineContainer>
        <DatePicker
          ref={datePickerRef}
          wrapperClassName={Styles.datePickerInput}
          popperClassName={Styles.popperStyle}
          dateFormat="yyyy-MM-dd"
          selected={new Date(expiry)}
          minDate={new Date(moment().add(1, 'd'))}
          onChange={(date) => { setExpiry(moment(date).format('yyyy-MM-DD')) }}
          calendarClassName={theme.palette.mode}
        />

        <IconButton onClick={() => {
          openDatePicker()
        }} component="span">
          <CalenderIcon />
        </IconButton>
      </S.InlineContainer>

      <S.InlineContainer>
        <Typography variant="body2"> Expires:</Typography>
        <S.InlineContainer gap="1" justifyContent="flex-end">
          {
            EXPIRY_OPTIONS.map((item) => <FormControlLabel sx={{ mx: "0" }} size="small" key={item.value} {...optionsProps(item)} control={<Radio size='small' />}>
            </FormControlLabel>)
          }
        </S.InlineContainer>
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
