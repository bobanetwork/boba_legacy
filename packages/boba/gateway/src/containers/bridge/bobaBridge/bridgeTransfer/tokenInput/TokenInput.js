import { AddCircleOutline, ArrowDropDown, RemoveCircleOutline } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { fetchClassicExitCost, fetchFastDepositCost, fetchFastExitCost, fetchL2FeeBalance } from 'actions/balanceAction';
import { setTokenAmount } from 'actions/bridgeAction';
import BN from 'bignumber.js';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBridgeType, selectTokenAmounts } from 'selectors/bridgeSelector';
import { selectLayer } from 'selectors/setupSelector';
import { logAmount } from 'util/amountConvert';
import { getCoinImage } from 'util/coinImage';
import { BRIDGE_TYPE } from 'util/constant';
import * as S from './TokenInput.styles';

function TokenInput({
  token,
  index,
  isFastBridge,
  tokenLen,
  switchBridgeType,
  addNewToken,
  deleteToken,
  openTokenPicker
}) {

  const bridgeType = useSelector(selectBridgeType());
  const tokenAmounts = useSelector(selectTokenAmounts());
  const layer = useSelector(selectLayer());

  const dispatch = useDispatch();

  const underZero = new BN(token.amount).lt(new BN(0))
  const overMax = new BN(token.amount).gt(new BN(token.balance))

  const amount = token.symbol === 'ETH' ?
    Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) :
    Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const onInputChange = (amount) => {
    dispatch(setTokenAmount({ symbol: token.symbol, amount }))
  }

  useEffect(() => {
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

  }, [ dispatch, layer, token, bridgeType ]);

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
          onClick={() => { openTokenPicker(index) }}
        >
          <img src={getCoinImage(token.symbol)} alt="logo" width={25} height={25} /> {token.symbol} <ArrowDropDown fontSize="medium" />
        </S.TokenPicker>
        <S.TextFieldWrapper>
          <S.TextFieldTag
            placeholder="enter amount"
            type="number"
            value={tokenAmounts[ token.symbol ]}
            onChange={(e) => {
              console.log([ `On value change ${token.symbol}`, e.target.value ]);
              onInputChange(e.target.value);
            }}
            fullWidth={true}
            variant="standard"
            error={underZero || overMax}
          />
        </S.TextFieldWrapper>
        <S.TokenPickerAction>
          <IconButton size="small" aria-label="add token"
            onClick={() => {
              if (tokenLen === 1 && bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
                switchBridgeType()
              } else {
                addNewToken()
              }
            }}
          >
            <AddCircleOutline fontSize="small" />
          </IconButton>
          <IconButton disabled={!isFastBridge && index === tokenLen - 1} size="small" aria-label="remove token"
            onClick={() => {
              deleteToken(index);
            }}
          >
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
