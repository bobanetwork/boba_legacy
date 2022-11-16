import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check'

import { L1Icons, L2Icons } from 'util/constant';

import * as S from './ChainSwitcherItem.styles'

function ChainSwitcherItem({
  chain,
  icon,
  label,
  onChainChange,
  currentChain
}) {

  return <S.ChainSwitcherItem
    divider
    key={chain}
    onClick={() => {
      onChainChange({chain})
    }}>
    <Box display="flex" justifyContent="space-around" alignItems="center" gap={2}>
      <Box display="flex" justifyContent="space-around" alignItems="center">
        {L1Icons[ icon ]}
        {L2Icons[ icon ]}
      </Box>
      <Typography flex={1} variant="body2" sx={{ whiteSpace: 'nowrap' }} >{label} </Typography>
      {currentChain === chain ? <CheckIcon color="#BAE21A" /> : null}
    </Box >
  </S.ChainSwitcherItem>
}

export default ChainSwitcherItem;
