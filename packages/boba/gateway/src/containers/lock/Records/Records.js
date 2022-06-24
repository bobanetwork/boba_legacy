import { Grid, Typography } from '@mui/material'
import React, { Fragment } from 'react'
import RecordItem from './RecordItem'

import * as G from 'containers/Global.styles'

function LockRecords() {

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
