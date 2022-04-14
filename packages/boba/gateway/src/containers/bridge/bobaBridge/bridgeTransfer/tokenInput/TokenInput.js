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

import { ArrowDropDown } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { openModal } from 'actions/uiAction'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectMultiBridgeMode } from 'selectors/bridgeSelector'
import { getCoinImage } from 'util/coinImage'
import * as S from './TokenInput.styles'

function TokenInput({
  token,
  index,
}) {
  const multibridgeMode = useSelector(selectMultiBridgeMode())
  const dispatch = useDispatch()

  const openTokenPicker = () => {
    dispatch(openModal('tokenPicker', null, null, index))
  }

  return (
    <S.TokenInputWrapper>
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
      </S.TokenInputContent>
    </S.TokenInputWrapper>
  )
}

export default React.memo(TokenInput)
