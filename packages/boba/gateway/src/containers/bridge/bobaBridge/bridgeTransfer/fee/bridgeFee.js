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
import { Box } from '@mui/material'

import Tooltip from 'components/tooltip/Tooltip'

import * as S from './bridgeFee.styles'

function BridgeFee({
  time,
  timeLabel,
  estFee,
  estFeeLabel,
  estBridgeFee,
  estBridgeFeeLabel,
  estRecieve,
  estRecieveLabel
}) {

  const ItemLabel = ({label, title}) => {
    console.log([ `Item label`, label ]);
    console.log([ `Item title`, title ]);
    return <S.BridgeFeeItemLabel>
      {label}
      {title ? <Tooltip title={title}>
        <HelpOutline sx={{ opacity: 0.65 }} fontSize="small" />
      </Tooltip> : null}
    </S.BridgeFeeItemLabel>
  }

  return <>
    {time ? <S.BridgeFeeItem>
      <ItemLabel label="Est. time" title={timeLabel} />
      <Box>
        {time}
      </Box>
    </S.BridgeFeeItem> : null}

    <S.BrigeFeeWrapper>
      <S.BridgeFeeItem>
        <ItemLabel label="Est. Fee (Approval+Bridge)" title={estFeeLabel} />
        <Box>
          {estFee}
        </Box>
      </S.BridgeFeeItem>
      <S.BridgeFeeItem>
        <ItemLabel label="Est. bridge fee" title={estBridgeFeeLabel} />
        <Box>
          {estBridgeFee}
        </Box>
      </S.BridgeFeeItem>
      <S.BridgeFeeItem>
        <ItemLabel label="Est. recieve" title={estRecieveLabel} />
        <Box>
          {estRecieve}
        </Box>
      </S.BridgeFeeItem>
    </S.BrigeFeeWrapper>
  </>
}

export default BridgeFee;
