import { Box, Grid, Typography } from '@mui/material'
import Button from 'components/button/Button'
import * as G from 'containers/Global.styles'
import BobaNFTGlass from 'assets/images/boba2/BobaNFTGlass.svg'
import {isSameMonth, isSameWeek, isBeforeDate, convertDate} from 'util/dates'
import React from 'react'

function RecordItem({
  onManage,
  lock
}) {

  const {
    tokenId,
    lockedAmount,
    balance,
    expiry } = lock

  const expired = isBeforeDate(expiry);

  const sameMonth = isSameMonth(expiry);
  const sameWeek = isSameWeek(expiry);

  let expiryText = '';
  if (sameMonth) {
    expiryText= 'Expires this month'
  }
  if (sameWeek) {
    expiryText= 'Expires in a week'
  }

  return <Grid container px={2} py={1} >
    <Grid item md={3}>
      <Box display="flex" alignItems="center" gap={2}>
        <G.ThumbnailContainer px={2} py={1}>
          <img src={BobaNFTGlass} alt="glass" />
        </G.ThumbnailContainer>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">#{tokenId}</Typography>
          <Typography variant="body2" >
            {
            expired ? 'Expired':
            convertDate(expiry,'YYYY-MM-DD')}</Typography>
          <Typography variant="body4" sx={{ opacity: 0.5 }} >{expiryText}</Typography>

        </Box>
      </Box>
    </Grid>
    <Grid item md={3}>
      <Box display="flex" flexDirection="column" alignItems="flex-start" py={2}>
        <Typography variant="body2">{lockedAmount.toFixed(2)}</Typography>
        <Typography variant="body3" sx={{ opacity: 0.5 }} >Boba</Typography>
      </Box>
    </Grid>
    <Grid item md={3}>
      <Box display="flex" flexDirection="column" alignItems="flex-start" py={2}>
        <Typography variant="body2">{balance.toFixed(2)}</Typography>
        <Typography variant="body3" sx={{ opacity: 0.5 }}>veBoba</Typography>
      </Box>
    </Grid>
    <Grid item md={3} >
      <Box display="flex" justifyContent="flex-end" alignItems="center" py={2}>
        <Button
          onClick={() => onManage(lock)}
          variant='outlined'
          color='primary'
          size="small">Manage</Button>
      </Box>
    </Grid>
  </Grid>

}

export default React.memo(RecordItem);
