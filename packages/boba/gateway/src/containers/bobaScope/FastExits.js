/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { useState, useEffect } from 'react'
import { Grid, Box } from '@mui/material'
import { useSelector } from 'react-redux'
import {formatDate} from 'util/dates'

import { selectLoading } from 'selectors'
import { Pager } from 'components'
import FastExit from 'components/seven/FastExit'

import styles from './Transactions.module.scss'
import { HistoryContainer, Content } from './styles'

const PER_PAGE = 10

function FastExits({ searchData, data }) {

  const [page, setPage] = useState(1)

  const loading = useSelector(selectLoading(['FASTEXITS/GETALL']))

  useEffect(() => {setPage(1)}, [searchData])

  const _data = data.filter(i => {
    return i.hash.includes(searchData) && i.to !== null
  })

  const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE)
  const endingIndex = page * PER_PAGE
  const paginatedData = _data.slice(startingIndex, endingIndex)

  let totalNumberOfPages = Math.ceil(_data.length / PER_PAGE)

  //if totalNumberOfPages === 0, set to one so we don't get the strange "page 1 of 0" display
  if (totalNumberOfPages === 0) totalNumberOfPages = 1

  return (
    <div className={styles.transactionSection}>
      <HistoryContainer>
        <Pager
          currentPage={page}
          isLastPage={paginatedData.length < PER_PAGE}
          totalPages={totalNumberOfPages}
          onClickNext={()=>setPage(page + 1)}
          onClickBack={()=>setPage(page - 1)}
        />

        <Grid item xs={12}>
          <Box>
            <Content>
              {!paginatedData.length && !loading && (
                <div className={styles.disclaimer}>Scanning for pending fast exits...</div>
              )}
              {!paginatedData.length && loading && (
                <div className={styles.disclaimer}>Loading pending fast exits...</div>
              )}
              {paginatedData.map((i, index) => {
                return (
                  <FastExit
                    key={index}
                    title={`Hash: ${i.hash}`}
                    blockNumber={`Block ${i.blockNumber}`}
                    oriHash={i.hash}
                    age={formatDate(i.timestamp, 'lll')}
                    unixTime={i.timestamp}
                  />
                )
              })}
            </Content>
          </Box>
        </Grid>
      </HistoryContainer>
    </div>
  );
}

export default React.memo(FastExits)
