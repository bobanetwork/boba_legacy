import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BigNumber, utils } from 'ethers'
import moment from 'moment'
import DatePicker from 'react-datepicker'

import { Box, FormControlLabel, Radio, Typography, useTheme, IconButton } from '@mui/material'

import Button from 'components/button/Button'
import Input from 'components/input/Input'
import CalenderIcon from 'components/icons/CalenderIcon'

import * as G from 'containers/Global.styles'

import { setConnectBOBA } from 'actions/setupAction'
import { createLock, fetchLockRecords } from 'actions/veBobaAction'

import { selectlayer2Balance } from 'selectors/balanceSelector'
import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector'

import { toWei_String } from 'util/amountConvert'
import { openAlert } from 'actions/uiAction'

import * as S from './CreateLock.styles'
import * as Styles from './CreateLock.module.scss'
import "react-datepicker/dist/react-datepicker.css"
import { useRef } from 'react'
import { selectLoading } from 'selectors/loadingSelector'
import { EXPIRY_OPTIONS } from 'util/constant'


function CreateLock({
  onCreateSuccess
}) {

  const dispatch = useDispatch()

  const theme = useTheme()
  const datePickerRef = useRef()

  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer2 = useSelector(selectlayer2Balance)
  const loading = useSelector(selectLoading([ 'LOCK/CREATE' ]))

  const [ value, setValue ] = useState('');

  const [ expiry, setExpiry ] = useState(EXPIRY_OPTIONS[ 0 ].value);
  const [ maxBalance, setMaxBalance ] = useState(0);

  useEffect(() => {
    if (layer2 && layer2.length > 0) {
      const token = Object.values(layer2).find((t) => t[ 'symbolL2' ] === 'BOBA')
      if (token) {
        let max_BN = BigNumber.from(token.balance.toString())
        setMaxBalance(utils.formatUnits(max_BN, token.decimals))
      }
    }

  }, [ layer2 ]);

  const optionsProps = ({ value, label }) => ({
    checked: expiry === value,
    onChange: (e) => setExpiry(e.target.value),
    value: value,
    label: <Typography variant="body4">{label}</Typography>
  })

  async function connectToBOBA() {
    dispatch(setConnectBOBA(true))
  }

  const openDatePicker = () => {
    let ele = datePickerRef.current;
    ele.setFocus(true);
  }

  const conversioRation = () => {
    const endD = moment(expiry);
    const currD = moment();
    let secondsYear = 365 * 24 * 3600;
    let secondsTillExpiry = endD.diff(currD, 'days') * 24 * 3600
    let ratio = (secondsTillExpiry / secondsYear);
    return ratio.toFixed(2);
  }


  const onCreateLock = async () => {

    const endD = moment(expiry);
    const currD = moment();
    // expiry duration in seconds
    const diffD = endD.diff(currD, 'days') * 24 * 3600;

    const res = await dispatch(createLock({
      value_Wei_String: toWei_String(value, 18),
      lock_duration: diffD
    }))
    setValue('')
    setExpiry(EXPIRY_OPTIONS[ 0 ].value)
    dispatch(fetchLockRecords());
    if (res) {
      dispatch(openAlert('Lock has been created!'));
    }
  }

  return <S.LockFormContainer>
    <Box>
      <Typography px={4} pt={2} variant="h2">Create New Lock</Typography>
      <G.DividerLine sx={{ my: 1 }} />
    </Box>
    <Box display="flex" flexDirection="column" py={2} px={4} gap={2}>

      <S.InlineContainer>
        <Typography variant="body2"> BOBA Balance:</Typography>
        <Typography variant="body2"> {maxBalance} </Typography>
      </S.InlineContainer>
      <Input
        placeholder="0"
        value={value}
        type="number"
        maxValue={maxBalance}
        onChange={i => { setValue(i.target.value) }}
        onUseMax={i => { setValue(maxBalance) }}
        newStyle
        disabled={!accountEnabled || layer !== 'L2'}
        variant="standard"
      />

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
          minDate={new Date(moment().add(8, 'days'))}
          maxDate={new Date(moment().add(1, 'year'))}
          onChange={(date) => {setExpiry(moment(date).format('yyyy-MM-DD'))}}
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

      <G.DividerLine sx={{ my: 1 }} />

      <S.InlineContainer>
        <Typography variant="body2">Convert ve BOBA Ratio</Typography>
        <Typography variant="body2"> {conversioRation()} </Typography>
      </S.InlineContainer>
      <S.InlineContainer>
        <Typography variant="body2">Your voting power will be</Typography>
        <Typography variant="body2"> {conversioRation()* value } ve BOBA </Typography>
      </S.InlineContainer>
      {
        !accountEnabled ?
          <Button
            fullWidth={true}
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => connectToBOBA()}
          >
            Connect to BOBA
          </Button> :
          <Button
            fullWidth={true}
            variant="contained"
            color="primary"
            size="large"
            loading={loading}
            disabled={!value || Number(value) > Number(maxBalance)}
            onClick={onCreateLock}
          >
            {Number(value) > Number(maxBalance) ? 'Insufficient balance' : 'Lock'}
          </Button>}
    </Box>
  </S.LockFormContainer>
}


export default React.memo(CreateLock)
