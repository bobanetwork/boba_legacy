import { Grid, Typography } from '@mui/material'
import React, { Fragment } from 'react'
import RecordItem from './RecordItem'

import * as G from 'containers/Global.styles'
import { useSelector } from 'react-redux'
import { selectLockRecords } from 'selectors/veBobaSelector'
import { selectLoading } from 'selectors/loadingSelector'

function LockRecords() {


  const loading = useSelector(selectLoading([ 'LOCK/RECORDS/GET' ]));
  const records = useSelector(selectLockRecords);

  console.log([ 'records', records ])
  console.log([ 'LOCK/RECORDS/GET > loading', loading ])

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
      <Grid item md={3}> </Grid>
    </Grid>
    <G.DividerLine />
    {[ 1, 2, 3, 4, 5 ].map((item, index) => <Fragment key={index}>
      <RecordItem />
      {(index < 4) ? <G.DividerLine variant='middle' /> : null}
    </Fragment>)}
  </>

}

export default React.memo(LockRecords)
