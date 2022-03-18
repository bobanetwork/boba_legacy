import { Box, Typography } from '@mui/material';
import { setBridgeType, setToken } from 'actions/bridgeAction';
import { openModal } from 'actions/uiAction';
import * as LayoutS from 'components/common/common.styles';
import { isEqual } from 'lodash';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectlayer1Balance, selectlayer2Balance } from 'selectors/balanceSelector';
import { selectBridgeType, selectTokens } from 'selectors/bridgeSelector';
import { selectLayer } from 'selectors/setupSelector';
import { BRIDGE_TYPE } from 'util/constant';
import * as S from './bridgeTransfer.styles';
import BridgeFee from './fee/bridgeFee';
import TokenInput from './tokenInput/TokenInput';
import BridgeTransferButton from './transfer';


function BridgeTransfer() {

  const layer = useSelector(selectLayer());
  const bridgeType = useSelector(selectBridgeType());
  const dispatch = useDispatch()
  const tokens = useSelector(selectTokens());

  const l1Balance = useSelector(selectlayer1Balance, isEqual)
  const l2Balance = useSelector(selectlayer2Balance, isEqual)

  let balances = l1Balance;

  if (layer === 'L2') {
    balances = l2Balance
  }

  useEffect(() => {
    if (balances.length > 0 && !tokens.length) {
      dispatch(setToken(balances[ 0 ]));
    }
  }, [ balances, dispatch, tokens, layer ])

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
      {
        tokens.map((token, index) => <TokenInput
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
      <BridgeTransferButton tokens={tokens} />
    </S.BridgeTransferContainer>
  )
}

export default React.memo(BridgeTransfer);
