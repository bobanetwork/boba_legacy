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
import { Box, Typography } from '@mui/material';
import { setBridgeType, setToken } from 'actions/bridgeAction';
import { openModal } from 'actions/uiAction';
import * as LayoutS from 'components/common/common.styles';
import { isEqual } from 'lodash';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectlayer1Balance, selectlayer2Balance } from 'selectors/balanceSelector';
import { selectBridgeTokens, selectBridgeType } from 'selectors/bridgeSelector';
import { selectLayer } from 'selectors/setupSelector';
import { BRIDGE_TYPE } from 'util/constant';
import * as S from './bridgeTransfer.styles';
import Deposit from './deposit/Deposit';
import Exit from './exit/Exit';
import BridgeFee from './fee/bridgeFee';
import TokenInput from './tokenInput/TokenInput';


function BridgeTransfer() {

  const layer = useSelector(selectLayer());
  const bridgeType = useSelector(selectBridgeType());
  const dispatch = useDispatch()
  const tokens = useSelector(selectBridgeTokens());

  const l1Balance = useSelector(selectlayer1Balance, isEqual)
  const l2Balance = useSelector(selectlayer2Balance, isEqual)

  let balances = l1Balance;

  if (layer === 'L2') {
    balances = l2Balance
  }

  useEffect(() => {
    dispatch(setBridgeType(BRIDGE_TYPE.CLASSIC_BRIDGE))
  }, [ dispatch ])

  const addNewToken = () => {
    dispatch(setToken(balances[ 0 ]));
  }

  const switchBridgeType = () => {
    dispatch(openModal('bridgeTypeSwitch'))
  }

  return (
    <S.BridgeTransferContainer>
      {!tokens.length ?
        <TokenInput
          index="0"
          key="empty"
          token={{ amount: '', symbol: null, balance: 0 }}
          addNewToken={addNewToken}
          tokenLen={1}
          switchBridgeType={switchBridgeType}
          isFastBridge={bridgeType === BRIDGE_TYPE.FAST_BRIDGE}
        />
        : tokens.map((token, index) => <TokenInput
          index={index}
          key={`${token.symbol}-${index}`}
          token={token}
          addNewToken={addNewToken}
          tokenLen={tokens.length}
          switchBridgeType={switchBridgeType}
          isFastBridge={bridgeType === BRIDGE_TYPE.FAST_BRIDGE} />)
      }
      <LayoutS.DividerLine sx={{ my: 1 }} />

      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">
          <Typography component="span" color="secondary">
            Recommendations: &nbsp;
          </Typography>
          {bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE ? 'Classic bridge' : 'Fast Bridge'}
        </Typography>
        <Typography variant="body2"
          onClick={switchBridgeType}
          sx={{
            textDecoration: 'underline',
            opacity: 0.6,
            cursor: 'pointer'
          }}
        >To {bridgeType !== BRIDGE_TYPE.CLASSIC_BRIDGE ? 'Classic bridge' : 'Fast Bridge'}
        </Typography>
      </Box>
      <BridgeFee tokens={tokens} />
      {tokens.length ?
        layer === 'L1' ? <Deposit /> : <Exit />
        : null
      }
    </S.BridgeTransferContainer>
  )
}

export default React.memo(BridgeTransfer);
