import { Box, Grid, Typography } from '@mui/material'
import React, { Fragment } from 'react'
import RecordItem from './RecordItem'

import * as G from 'containers/Global.styles'
import { useSelector } from 'react-redux'
import { selectLockRecords } from 'selectors/veBobaSelector'
import { selectLoading } from 'selectors/loadingSelector'
import { useDispatch } from 'react-redux'
import { openModal } from 'actions/uiAction'
import Button from 'components/button/Button'

const LockRecords = () => {

  const dispatch = useDispatch();
  const loading = useSelector(selectLoading([ 'LOCK/RECORDS/GET' ]));
  const records = useSelector(selectLockRecords);

  const onManage = () => {
    dispatch(openModal('manageLock', null, null, null, {
      tokenId: 1,
      expiry: new Date(1664409600 * 1000),
      balance: 100,
      lockedAmount: 85,
    }))
  }

  if (!!loading) {
    return <Grid container p={2} > loading lock records..</Grid>
  }

  return <>
    <Grid container p={2} >
      <Grid item md={3}>
        <Typography variant="body2">
          NFT ID / Lock Expires
        </Typography>
      </Grid>
      <Grid item md={3}>
        <Typography variant="body2">
          Lock Amount
        </Typography>
      </Grid>
      <Grid item md={3}>
        <Typography variant="body2">
          Vote Value
        </Typography>
      </Grid>
      <Grid item md={3}>
        <Box display="flex" justifyContent="flex-end" alignItems="center">
          <Button
            onClick={onManage}
            variant='outlined'
            color='primary'
            size="small">Manage</Button>
        </Box>
      </Grid>
    </Grid>
    <G.DividerLine />
    {records.map((nftRecord, index) => <Fragment key={index}>
      <RecordItem onManage={onManage} {...nftRecord} />
      {(index < 4) ? <G.DividerLine variant='middle' /> : null}
    </Fragment>)}
  </>

}

export default React.memo(LockRecords)
