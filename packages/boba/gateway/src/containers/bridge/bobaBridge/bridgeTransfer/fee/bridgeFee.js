import { Box, Typography } from '@mui/material'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectClassicExitCost, selectFastDepositCost, selectFastExitCost } from 'selectors/balanceSelector'
import { selectBridgeType } from 'selectors/bridgeSelector'
import { selectLayer } from 'selectors/setupSelector'
import { BRIDGE_TYPE } from 'util/constant'
import * as S from './bridgeFee.styles'

function BridgeFee({
  tokens
}) {
  const bridgeType = useSelector(selectBridgeType())
  const layer = useSelector(selectLayer())

  const cExitCost = useSelector(selectClassicExitCost)
  const fExitCost = useSelector(selectFastExitCost)
  const fDepositCost = useSelector(selectFastDepositCost)

  // const feeBalance = useSelector(selectL2FeeBalance)
  // TODO: Use feebalance to show the cover gas
  // FIXME: show the appropriate message base on gas fee

  let cost = 0

  if (layer === 'L2') {
    if (bridgeType === BRIDGE_TYPE.FAST_BRIDGE) {
      cost = fExitCost
    } else {
      cost = cExitCost
    }
  } else {
    if (bridgeType === BRIDGE_TYPE.FAST_BRIDGE) {
      cost = fDepositCost
    }
  }

  return <S.BrigeFeeWrapper>
    <S.BridgeFeeItem>
      <Typography variant="body2" sx={{
        opacity: 0.65
      }}>
        Est. Fee <br />
        (Approval+Bridge)
      </Typography>
      <Box>
        {
          tokens.map((token, i) => {
            return <Typography key={i} variant="body2" >
              {
                token.symbol === 'ETH' ?
                  `${(Number(token.amount) + Number(cost)).toFixed(4)}`
                  : `${Number(cost).toFixed(4)}`
              } ETH
            </Typography>
          })
        }
      </Box>
    </S.BridgeFeeItem>
    <S.BridgeFeeItem>
      <Typography variant="body2" sx={{ opacity: 0.65 }}>
        Est. bridge fee
      </Typography>
      <Box>
        {tokens.map((token, i) => <Typography key={i} variant="body2" >
          0.000 {token.symbol} (0.1%)
        </Typography>)}
      </Box>
    </S.BridgeFeeItem>
    <S.BridgeFeeItem>
      <Typography variant="body2" sx={{ opacity: 0.65 }}>
        Est. recieve
      </Typography>
      <Box>
        {tokens.map((token, i) => <Typography key={i} variant="body2" >
          {`${Number(token.amount).toFixed(3)} ${token.symbol}`}
        </Typography>)}
      </Box>
    </S.BridgeFeeItem>
  </S.BrigeFeeWrapper>

}

export default BridgeFee;
