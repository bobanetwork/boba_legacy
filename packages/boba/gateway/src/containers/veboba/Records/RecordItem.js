import { Box, Grid, Typography } from '@mui/material'
import Button from 'components/button/Button'
import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg'
import moment from 'moment'
import React from 'react'
import * as S from './RecordItem.styles'

function RecordItem({
  key,
  tokenId,
  lockedAmount,
  balance,
  expiry,
  onManage
}) {



  return <Grid container px={2} py={1} >
    <Grid item md={3}>
      <Box display="flex" alignItems="center" gap={2}>
        <S.ThumbnailContainer px={2} py={1}>
          <img src={BobaNFTGlass} alt="glass" />
        </S.ThumbnailContainer>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">#{tokenId}</Typography>
          <Typography variant="body2" >{moment(expiry).format('YYYY-MM-DD')}</Typography>
          {/* <Typography variant="body4" sx={{ opacity: 0.5 }} >Expires in month</Typography> */}
        </Box>
      </Box>
    </Grid>
    <Grid item md={3}>
      <Box display="flex" flexDirection="column" alignItems="flex-start">
        <Typography variant="body2">{lockedAmount}</Typography>
        <Typography variant="body4" sx={{ opacity: 0.5 }} >Boba</Typography>
      </Box>
    </Grid>
    <Grid item md={3}>
      <Box display="flex" flexDirection="column" alignItems="flex-start">
        <Typography variant="body2">{balance}</Typography>
        <Typography variant="body4" sx={{ opacity: 0.5 }}>veBoba</Typography>
      </Box>
    </Grid>
    <Grid item md={3} >
      <Box display="flex" justifyContent="flex-end" alignItems="center">
        <Button
          onClick={onManage}
          variant='outlined'
          color='primary'
          size="small">Manage</Button>
      </Box>
    </Grid>
  </Grid>

}

export default React.memo(RecordItem);
