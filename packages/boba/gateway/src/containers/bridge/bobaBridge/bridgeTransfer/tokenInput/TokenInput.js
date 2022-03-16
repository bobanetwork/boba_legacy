import { AddCircleOutline, ArrowDropDown, RemoveCircleOutline } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import BN from 'bignumber.js';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectBridgeType } from 'selectors/bridgeSelector';
import { logAmount } from 'util/amountConvert';
import { getCoinImage } from 'util/coinImage';
import { BRIDGE_TYPE } from 'util/constant';
import * as S from './TokenInput.styles';

function TokenInput({
  token,
  isFastBridge,
  tokenLen,
  switchBridgeType,
  addNewToken,
  openTokenPicker
}) {

  const bridgeType = useSelector(selectBridgeType());
  const underZero = new BN(token.amount).lt(new BN(0))
  const overMax = new BN(token.amount).gt(new BN(token.balance))
  
  
  const amount = token.symbol === 'ETH' ? 
      Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, {minimumFractionDigits: 3,maximumFractionDigits:3}) :
      Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, {minimumFractionDigits: 2,maximumFractionDigits:2})

  return (
    <S.TokenInputWrapper>
      <Box
        textAlign="right"
      >
        <Typography variant="body2">
          <Typography component="span" sx={{ opacity: 0.65 }}>
            Available Balance : &nbsp;
          </Typography>
          {amount}
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="space-around"
        alignItems="center"
        sx={{ gap: '5px' }}
      >
        <S.TokenPicker
          onClick={openTokenPicker}
        >
          <img src={getCoinImage(token.symbol)} alt="logo" width={25} height={25} /> {token.symbol} <ArrowDropDown fontSize="medium" />
        </S.TokenPicker>
        <S.TextFieldWrapper>
          <S.TextFieldTag
            placeholder="enter amount"
            type="number"
            value={"0"}
            onChange={(e) => {
              console.log([ `On value change ${token.symbol}`, e.target.value ]);
            }}
            fullWidth={true}
            variant="standard"
            error={underZero || overMax}
          />
        </S.TextFieldWrapper>
        <S.TokenPickerAction>
          <IconButton size="small" aria-label="add token"
            onClick={() => {
              if (tokenLen === 1 && bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE)  {
                switchBridgeType()
              } else {
                addNewToken()
              }
            }}
          >
            <AddCircleOutline fontSize="small" />
          </IconButton>
          <IconButton  disabled={!isFastBridge || tokenLen > 1} size="small" aria-label="remove token">
            <RemoveCircleOutline fontSize="small" />
          </IconButton>
        </S.TokenPickerAction>
      </Box>
      {token.amount !== '' && underZero ?
        <Typography variant="body3" sx={{ mt: 1 }}>
          Value too small: the value must be greater than 0
        </Typography>
        : null
      }
      {token.amount !== '' && overMax ?
        <Typography variant="body3" sx={{ mt: 1 }}>
          Value too large: the value must be smaller than {Number(token.balance).toFixed(3)}
        </Typography>
        : null}
    </S.TokenInputWrapper>
  )
}

export default React.memo(TokenInput)
