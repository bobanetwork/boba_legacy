/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { AddCircleOutline, ArrowDropDown, RemoveCircleOutline } from '@mui/icons-material';
import { IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import { fetchClassicExitCost, fetchFastDepositCost, fetchFastExitCost, fetchL2FeeBalance } from 'actions/balanceAction';
import { removeToken, setTokenAmount } from 'actions/bridgeAction';
import { openModal } from 'actions/uiAction';
import BN from 'bignumber.js';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBridgeType, selectMultiBridgeMode } from 'selectors/bridgeSelector';
import { selectLayer } from 'selectors/setupSelector';
import { logAmount, toWei_String } from 'util/amountConvert';
import { getCoinImage } from 'util/coinImage';
import { BRIDGE_TYPE } from 'util/constant';
import * as S from './TokenInput.styles';

function TokenInput({
  token,
  index,
  tokenLen,
  addNewToken
}) {

  const bridgeType = useSelector(selectBridgeType());
  const layer = useSelector(selectLayer());
  const multibridgeMode = useSelector(selectMultiBridgeMode());

  const dispatch = useDispatch();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))


  const underZero = new BN(token.amount).lt(new BN(0))
  const maxValue = logAmount(token.balance, token.decimals);
  const overMax = new BN(token.amount).gt(new BN(maxValue))

  let amount = 0;
  if (token.symbol) {
    amount = token.symbol === 'ETH' ?
      Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) :
      Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const onInputChange = (amount) => {
    dispatch(setTokenAmount({
      index,
      amount,
      toWei_String: toWei_String(amount, token.decimals)
    }))
  }

  const deleteToken = (tokenIndex) => {
    dispatch(removeToken(tokenIndex));
  }

  const openTokenPicker = () => {
    dispatch(openModal('tokenPicker', null, null, index))
  }

  const isAddTokenDisabled = () => {
    if (layer === 'L2') {
      return true;
    }
    if (tokenLen > 3) {
      return true;
    } else {
      return false;
    }
  }

  useEffect(() => {
    if (token.symbol) {
      if (layer === 'L2') {
        if (bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
          dispatch(fetchClassicExitCost(token.address));
        } else {
          dispatch(fetchFastExitCost(token.address));
        }
        dispatch(fetchL2FeeBalance())
      } else {
        if (bridgeType === BRIDGE_TYPE.FAST_BRIDGE) {
          dispatch(fetchFastDepositCost(token.address))
        }
      }
    }
  }, [ dispatch, layer, token, bridgeType ]);


  const Action = () => {
    return <S.TokenPickerAction>
    <IconButton size="small" aria-label="add token"
      disabled={isAddTokenDisabled()} // as we are going to enable it only for the L1 layer + fast Fast Deposit
      onClick={() => {
          addNewToken()
      }}
    >
      <AddCircleOutline fontSize="small" />
    </IconButton>
    <IconButton disabled={tokenLen < 2} size="small" aria-label="remove token"
      onClick={() => {
        deleteToken(index);
      }}
    >
      <RemoveCircleOutline fontSize="small" />
    </IconButton>
  </S.TokenPickerAction>
  }

  return (
    <S.TokenInputWrapper>
      <S.TokenInputTitle
      >
        <Typography variant="body2">
          <Typography variant="body2" component="span" sx={{ opacity: 0.65 }}>
            Available Balance : &nbsp;
          </Typography>
          <Typography variant="body2" component="span" sx={{textDecoration: 'underline'}}>
            {amount}
          </Typography>
        </Typography>
        {isMobile && multibridgeMode ? <Action /> : null}
      </S.TokenInputTitle>
      <S.TokenInputContent>
        {
          !token.symbol ?
            <S.TokenPicker
              sx={{
                background: '#BAE21A',
                color: '#031313',
              }}
              onClick={() => { openTokenPicker(index) }}
            >
              <Typography whiteSpace="nowrap" variant="body2">Select {multibridgeMode ? 'Tokens' : 'Token'}</Typography>
              <ArrowDropDown fontSize="medium" />
            </S.TokenPicker> :
            <S.TokenPicker
              onClick={() => { openTokenPicker(index) }}
            >
              <img src={getCoinImage(token.symbol)} alt="logo" width={25} height={25} /> {token.symbol}
              <ArrowDropDown fontSize="medium" />
            </S.TokenPicker>
        }
        <S.TextFieldWrapper>
          {!token.symbol ?
            <S.TextFieldTag
              placeholder="enter amount"
              type="number"
              value={0}
              fullWidth={true}
              variant="standard"
            /> : <S.TextFieldTag
              placeholder="enter amount"
              type="number"
              value={token.amount}
              onChange={(e) => {
                onInputChange(e.target.value);
              }}
              fullWidth={true}
              variant="standard"
              error={underZero || overMax}
            />}
        </S.TextFieldWrapper>
        {!isMobile && multibridgeMode ? <Action /> : null}
      </S.TokenInputContent>
      {token.amount !== '' && underZero ?
        <Typography variant="body3" sx={{ mt: 1 }}>
          Value too small: the value must be greater than 0
        </Typography>
        : null
      }
      {token.amount !== '' && overMax ?
        <Typography variant="body3" sx={{ mt: 1 }}>
          Value too large: the value must be smaller than {Number(logAmount(token.balance, token.decimals)).toFixed(3)}
        </Typography>
        : null}
    </S.TokenInputWrapper>
  )
}

export default React.memo(TokenInput)
