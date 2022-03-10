import { Box, Typography } from '@mui/material';
import Button from 'components/button/Button';
import * as LayoutS from 'components/common/common.styles';
import { BRIDGE_TYPE } from 'containers/bridge/bridge.const';
import React, { useState } from 'react';
import * as S from './bridgeTransfer.styles';
import TokenInput from './tokenInput/TokenInput';

function BridgeTransfer() {

  const [ bridgeType, setBridgeType ] = useState(BRIDGE_TYPE.CLASSIC_BRIDGE)
  // TODO: Move this to reducer so we can update it via action.

  const selectedTokens = [
    {
      symbol: 'BTC',
      unit: 'WBTC',
      amount: '-2',
      balance: '10,000',
    },
    {
      symbol: 'DAI',
      unit: 'DAI',
      amount: 4000002,
      balance: 50000,
    },
    {
      symbol: 'UNI',
      unit: 'UNI',
      amount: '0.122',
      balance: '123,000',
    },
    {
      symbol: 'BOBA',
      unit: 'BOBA',
      amount: '0.002',
      balance: '10,000',
    },
  ];


  return (
    <S.BridgeTransferContainer>
      {
        selectedTokens.map((token) => <TokenInput token={token} bridgeType={bridgeType} />)
      }
      <LayoutS.DividerLine sx={{ my: 1 }} />

      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">
          <Typography component="span" color="secondary">
            Recommendations: &nbsp;
          </Typography>
          {bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE ? 'Classic bridge' : 'Fast Bridge'}
        </Typography>
        <Typography variant="body2" sx={{
          textDecoration: 'underline',
          opacity: 0.6
        }}>To {bridgeType !== BRIDGE_TYPE.CLASSIC_BRIDGE ? 'Classic bridge' : 'Fast Bridge'}
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">
          <Typography component="span" sx={{ opacity: 0.65 }}>
            Est Time: &nbsp;
          </Typography>
          20mins
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" alignItems="flex-start" justifyContent="flex-start" flexDirection="column">
          <Typography variant="body2" sx={{
            opacity: 0.65
          }}>
            Est. Fee
            (Approval+Bridge)
          </Typography>
          <Typography variant="body2" >
            0.002 ETH
          </Typography>
        </Box>
        <Box display="flex" alignItems="flex-start" justifyContent="flex-start" flexDirection="column">
          <Typography variant="body2" sx={{ opacity: 0.65 }}>
            Est. bridge fee
          </Typography>
          <Typography variant="body2" >
            0.00019780 BTC (0.1%)
          </Typography>
        </Box>
        <Box display="flex" alignItems="flex-start" justifyContent="flex-start" flexDirection="column">
          <Typography variant="body2" sx={{ opacity: 0.65 }}>
            Est. recieve
          </Typography>
          <Typography variant="body2" >
            1.24 BTC
          </Typography>
        </Box>
      </Box>
      <Button
        color="primary"
        variant="contained"
        fullWidth={true}
      >Transfer</Button>
    </S.BridgeTransferContainer>
  )
}

export default React.memo(BridgeTransfer);
