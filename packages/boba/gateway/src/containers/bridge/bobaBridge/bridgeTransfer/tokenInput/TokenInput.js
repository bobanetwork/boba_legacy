import { AddCircleOutline, ArrowDropDown, RemoveCircleOutline } from '@mui/icons-material';
import { Box, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import BN from 'bignumber.js'
import React from 'react';
import { getCoinImage } from 'util/coinImage';
import * as S from './TokenInput.styles';

function TokenInput({
  token
}) {

  const underZero = new BN(token.amount).lt(new BN(0))
  const overMax = new BN(token.amount).gt(new BN(token.balance))

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  console.log([ 'isMobile', isMobile ])

  return (
    <S.TokenInputWrapper>
      <Box
        textAlign="right"
      >
        <Typography variant="body2">
          <Typography component="span" sx={{ opacity: 0.65 }}>
            Available Balance : &nbsp;
          </Typography>
          {token.balance}
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="space-around"
        alignItems="center"
        sx={{ gap: '5px' }}
      >
        <S.TokenPicker
        >
          <img src={getCoinImage(token.unit)} alt="logo" width={25} height={25} /> {token.symbol} <ArrowDropDown fontSize="medium" />
        </S.TokenPicker>
        <S.TextFieldWrapper>
          <S.TextFieldTag
            placeholder="enter amount"
            type="number"
            value={token.amount}
            onChange={(e) => {
              console.log([ `On value change ${token.symbol}`, e.target.value ]);
            }}
            fullWidth={true}
            variant="standard"
            error={underZero || overMax}
          />
        </S.TextFieldWrapper>
        <S.TokenPickerAction>
          <IconButton size="small" aria-label="add token">
            <AddCircleOutline fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="remove token">
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
