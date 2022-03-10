import { Box } from '@mui/material';
import React from 'react'


function TokenPickerModal({onSelect, selectedTokens}) {

  return (
    <>
      <Box>USDC</Box>
      <Box>USDC</Box>
      <Box>USDC</Box>
      <Box>USDC</Box>
      <Box>USDC</Box>
      <Box>USDC</Box>
    </>
  )
}

export default React.memo(TokenPickerModal);
