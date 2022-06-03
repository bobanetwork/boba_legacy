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
import React from 'react'

import { HelpOutline } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'

import Tooltip from 'components/tooltip/Tooltip'

import * as S from './BridgeFee.styles'

function BridgeFee({
  time,
  estFee,
  exitFee,
  lpFee,
  estReceive,
  exitFeeInfo,
  timeInfo,
  estFeeInfo,
  lpFeeInfo,
  estReceiveInfo
}) {

  const ItemLabel = ({ label, info }) => {
    return <S.BridgeFeeItemLabel variant='body2'>
      {label}
      {info ? <Tooltip title={info}>
        <HelpOutline sx={{ opacity: 0.65 }} fontSize="small" />
      </Tooltip> : null}
    </S.BridgeFeeItemLabel>
  }

  return <Box py={1}>
    {time ? <S.BridgeFeeItem>
      <ItemLabel label="Est. time" info={timeInfo} />
      <Typography variant='body2'>
        {time}
      </Typography>
    </S.BridgeFeeItem> : null}

    <S.BrigeFeeWrapper>
      {estFee ? <S.BridgeFeeItem>
        <ItemLabel label="Est. gas" info={estFeeInfo} />
        <Typography variant='body2'>
          {estFee}
        </Typography>
      </S.BridgeFeeItem> : null}
      {lpFee ? <S.BridgeFeeItem>
        <ItemLabel label="LP fee" info={lpFeeInfo} />
        <Typography variant='body2'>
          {lpFee}
        </Typography>
      </S.BridgeFeeItem> : null}
      {exitFee ? <S.BridgeFeeItem>
        <ItemLabel label="xChain Relay fee" info={exitFeeInfo} />
        <Typography variant='body2'>
          {exitFee}
        </Typography>
      </S.BridgeFeeItem> : null}
      {estReceive ? <S.BridgeFeeItem>
        <ItemLabel label="Est. receive" info={estReceiveInfo} />
        <Typography variant='body2'>
          {estReceive}
        </Typography>
      </S.BridgeFeeItem> : null}
    </S.BrigeFeeWrapper>
  </Box>
}

export default BridgeFee;
