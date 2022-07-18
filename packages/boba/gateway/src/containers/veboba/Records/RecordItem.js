import { Box, Grid, Typography } from '@mui/material'
import Button from 'components/button/Button'
import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg'
import moment from 'moment'
import React from 'react'
import * as S from './RecordItem.styles'

function RecordItem({
  onManage,
  lock
}) {

  const {
    tokenId,
    lockedAmount,
    balance,
    expiry } = lock

  const expired = moment(expiry).isBefore(moment());

  const sameMonth = moment(expiry).isSame(moment(), 'month');
  const sameWeek = moment(expiry).isSame(moment(), 'week');

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
        <S.ThumbnailContainer px={2} py={1}>
          <img src={BobaNFTGlass} alt="glass" />
        </S.ThumbnailContainer>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">#{tokenId}</Typography>
          <Typography variant="body2" >
            {
            expired ? 'Expired':
            moment(expiry).format('YYYY-MM-DD')}</Typography>
          <Typography variant="body4" sx={{ opacity: 0.5 }} >{expiryText}</Typography>

        </Box>
      </Box>
    </Grid>
    <Grid item md={3}>
      <Box display="flex" flexDirection="column" alignItems="flex-start" py={2}>
        <Typography variant="body2">{lockedAmount}</Typography>
        <Typography variant="body3" sx={{ opacity: 0.5 }} >Boba</Typography>
      </Box>
    </Grid>
    <Grid item md={3}>
      <Box display="flex" flexDirection="column" alignItems="flex-start" py={2}>
        <Typography variant="body2">{balance}</Typography>
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
