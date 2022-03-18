import { Box, Typography } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectClassicExitCost, selectFastDepositCost, selectFastExitCost, selectL2FeeBalance } from 'selectors/balanceSelector';
import { selectBridgeType, selectTokenAmounts } from 'selectors/bridgeSelector';
import { selectLayer } from 'selectors/setupSelector';
import { BRIDGE_TYPE } from 'util/constant';


function BridgeFee({
  tokens
}) {

  const tokenAmounts = useSelector(selectTokenAmounts());
  const bridgeType = useSelector(selectBridgeType());
  const layer = useSelector(selectLayer());

  const cExitCost = useSelector(selectClassicExitCost);
  const fExitCost = useSelector(selectFastExitCost);
  const fDepositCost = useSelector(selectFastDepositCost);

  const feeBalance = useSelector(selectL2FeeBalance)
  // TODO: Use feebalance to show the cover gas
  // FIXME: show the appropriate message base on gas fee

  let cost = 0;

  console.log([ 'cExitCost', cExitCost ])
  console.log([ 'fExitCost', fExitCost ])
  console.log([ 'fDepositCost', fDepositCost ])
  console.log([ 'feeBalance', feeBalance ])

  if (layer === 'L2') {
    if (bridgeType === BRIDGE_TYPE.FAST_BRIDGE) {
      cost = fExitCost;
    } else {
      cost = cExitCost;
    }
  } else {
    if (bridgeType === BRIDGE_TYPE.FAST_BRIDGE) {
      cost = fDepositCost;
    }
  }

  return <>
    <Box display="flex" justifyContent="space-between">
      <Box display="flex" alignItems="flex-start" justifyContent="flex-start" flexDirection="column">
        <Typography variant="body2" sx={{
          opacity: 0.65
        }}>
          Est. Fee <br/>
          (Approval+Bridge)
        </Typography>
        {Object.keys(tokenAmounts).map((t) => {
          return <Typography variant="body2" >
            {
              t === 'ETH' ?
                `${(Number(tokenAmounts[ t ]) + Number(cost)).toFixed(4)}`
                : `${Number(cost).toFixed(4)}`
            } ETH
          </Typography>
        })}
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
        {Object.keys(tokenAmounts).map((t) => {
          return <Typography variant="body2" >
            {`${Number(tokenAmounts[ t ]).toFixed(3)} ${t}`}
          </Typography>
        })}
      </Box>
    </Box>
  </>
}

export default React.memo(BridgeFee);
