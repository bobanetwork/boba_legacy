/*
Copyright 2019-present OmiseGO Pte Ltd

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
import { Grid, Box } from '@material-ui/core'
import { useSelector } from 'react-redux'
import moment from 'moment'

import { selectLoading } from 'selectors/loadingSelector'
import Pager from 'components/pager/Pager'
import Seven from 'components/seven/Seven'

import * as styles from './Transactions.module.scss'
import * as S from './History.styles'

const PER_PAGE = 10

function Sevens({ searchData, sevens }) {

  const [page, setPage] = useState(1)

  const loading = useSelector(selectLoading(['SEVENS/GETALL']))

  useEffect(() => {setPage(1)}, [searchData])

  const _sevens = sevens.filter(i => {
    return i.hash.includes(searchData) && i.to !== null
  })

  const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE)
  const endingIndex = page * PER_PAGE
  const paginatedSevens = _sevens.slice(startingIndex, endingIndex)

  let totalNumberOfPages = Math.ceil(_sevens.length / PER_PAGE);

  //if totalNumberOfPages === 0, set to one so we don't get the strange "page 1 of 0" display
  if (totalNumberOfPages === 0) totalNumberOfPages = 1

  return (
    <div className={styles.transactionSection}>
      <S.HistoryContainer>
        <Pager
          currentPage={page}
          isLastPage={paginatedSevens.length < PER_PAGE}
          totalPages={totalNumberOfPages}
          onClickNext={()=>setPage(page + 1)}
          onClickBack={()=>setPage(page - 1)}
        />

        <Grid item xs={12}>
          <Box>
            <S.Content>
              {!paginatedSevens.length && !loading && (
                <div className={styles.disclaimer}>Scanning for pending 7 day exits...</div>
              )}
              {!paginatedSevens.length && loading && (
                <div className={styles.disclaimer}>Loading pending 7 day exits...</div>
              )}
              {paginatedSevens.map((i, index) => {
                return (
                  <Seven
                    key={index}
                    title={`Hash: ${i.hash}`}
                    blockNumber={`Block ${i.blockNumber}`}
                    oriHash={i.hash}
                    age={moment.unix(i.timestamp).format('lll')}
                    unixTime={i.timestamp}
                  />
                )
              })}
            </S.Content>
          </Box>
        </Grid>
      </S.HistoryContainer>
    </div>
  );
}

export default React.memo(Sevens)
