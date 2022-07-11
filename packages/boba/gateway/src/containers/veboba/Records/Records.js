import { Grid, Typography } from '@mui/material'
import React, { Fragment } from 'react'
import RecordItem from './RecordItem'

import * as G from 'containers/Global.styles'
import { useSelector } from 'react-redux'
import { selectLockRecords } from 'selectors/veBobaSelector'
import { selectLoading } from 'selectors/loadingSelector'
import { useDispatch } from 'react-redux'
import { openModal } from 'actions/uiAction'

const LockRecords = () => {

  const dispatch = useDispatch();
  const loading = useSelector(selectLoading([ 'LOCK/RECORDS' ]));

  const records = useSelector(selectLockRecords);

  const onManage = (lock) => {
    dispatch(openModal('manageLock', null, null, null, lock))
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

      </Grid>
    </Grid>
    <G.DividerLine />
    {loading ? <Grid container>
      <Grid item md={12} p={2}>
        <Typography variant="body">
          loading...
        </Typography>
      </Grid>
    </Grid> : null}
    {records.map((nftRecord, index) => <Fragment key={index}>
      <RecordItem onManage={onManage} lock={nftRecord} />
      {(index < 4) ? <G.DividerLine variant='middle' /> : null}
    </Fragment>)}
  </>

}

export default React.memo(LockRecords)
