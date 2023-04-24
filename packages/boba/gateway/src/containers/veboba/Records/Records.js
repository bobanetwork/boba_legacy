import { Grid, Typography } from '@mui/material'
import React, { Fragment, useState } from 'react'
import RecordItem from './RecordItem'

import * as G from 'containers/Global.styles'
import { useSelector } from 'react-redux'
import { selectLockRecords } from 'selectors/veBobaSelector'
import { selectLoading } from 'selectors/loadingSelector'
import { useDispatch } from 'react-redux'
import { openModal } from 'actions/uiAction'
import { Pager } from 'components'

const PER_PAGE = 8

const LockRecords = () => {

  const dispatch = useDispatch();
  const loading = useSelector(selectLoading([ 'LOCK/RECORDS' ]));
  const [page, setPage] = useState(1)

  const records = useSelector(selectLockRecords);

  const onManage = (lock) => {
    dispatch(openModal('manageLock', null, null, null, lock))
  }

  const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE)
  const endingIndex = page * PER_PAGE
  const paginatedRecords = records.slice(startingIndex, endingIndex)


  let totalNumberOfPages = Math.ceil(records.length / PER_PAGE)

  //if totalNumberOfPages === 0, set to one so we don't get the strange "page 1 of 0" display
  if (totalNumberOfPages === 0) totalNumberOfPages = 1

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
    {paginatedRecords.map((nftRecord, index) => <Fragment key={index}>
      <RecordItem onManage={onManage} lock={nftRecord} />
      {(index < 4) ? <G.DividerLine variant='middle' /> : null}
    </Fragment>)}
    <Pager
        currentPage={page}
        isLastPage={paginatedRecords.length < PER_PAGE}
        totalPages={totalNumberOfPages}
        onClickNext={() => setPage(page + 1)}
        onClickBack={() => setPage(page - 1)}
      />
  </>

}

export default React.memo(LockRecords)
