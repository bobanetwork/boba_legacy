import { Box, Typography } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectBridgeType } from 'selectors/bridgeSelector';


function BridgeFee({
  tokens
}) {

  const bridgeType = useSelector(selectBridgeType());
  console.log([ 'bridgeType', bridgeType ])

  return <>
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
  </>
}

export default React.memo(BridgeFee);
