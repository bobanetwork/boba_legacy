import React from 'react';
import { Box, Typography } from '@mui/material';

import CheckIcon from '@mui/icons-material/Check'
import { L1_ICONS, L2_ICONS } from 'util/network.util';

import * as S from './NetworkListItem.styles'

function NetworkListItem({
  chain,
  icon,
  label,
  onChainChange,
  isActive
}) {

  return <S.ChainSwitcherItem
    divider
    key={chain}
    onClick={() => {
      onChainChange({chain})
    }}>
    <Box display="flex" justifyContent="space-around" alignItems="center" gap={2}>
      <Box display="flex" justifyContent="space-around" alignItems="center">
        {L1_ICONS[ icon ]}
        {L2_ICONS[ icon ]}
      </Box>
      <Typography flex={1} variant="body2" sx={{ whiteSpace: 'nowrap' }} >{label} </Typography>
      {isActive ? <CheckIcon color="#BAE21A" /> : null}
    </Box >
  </S.ChainSwitcherItem>
}

export default NetworkListItem;
