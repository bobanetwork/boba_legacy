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

import { Box, Grid } from '@mui/material'
import moment from 'moment'
import React, { useState } from 'react'


import { logAmount } from 'util/amountConvert'

import Pager from 'components/pager/Pager'
import Transaction from 'components/transaction/Transaction'
import * as S from './History.styles'
import { useSelector } from 'react-redux'
import { selectLoading } from 'selectors/loadingSelector'

const PER_PAGE = 8

function TX_Transfers({ searchHistory, transactions, chainLink }) {

  const [page, setPage] = useState(1)
  const loading = useSelector(selectLoading(['TRANSACTION/GETALL']))
  const _transfers = transactions.filter(i => {
    return i.hash.includes(searchHistory) && i.to !== null && i.altL1
  })

  const renderTransfers = _transfers.map((i, index) => {

    const chain = (i.chain === 'L0pending') ? 'L0' : i.chain

    let timeLabel = moment.unix(i.timeStamp).format('lll')

    let amountTx = `${logAmount(i.amount, 18, 3)} BOBA`;

    return (
      <Transaction
        key={`${index}`}
        chain={`Bridge between L1's`}
        title={`${chain} Hash: ${i.hash}`}
        blockNumber={`Block ${i.blockNumber}`}
        time={timeLabel}
        button={undefined}
        typeTX={``}
        oriChain={chain}
        oriHash={i.hash}
        amountTx={amountTx}
        tx_ref={i.reference}
        eventType={i.event_type}
        toChain={i.destination_chain}
      />
    )
  })

  const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE)
  const endingIndex = page * PER_PAGE
  const paginatedExits = renderTransfers.slice(startingIndex, endingIndex)

  let totalNumberOfPages = Math.ceil(renderTransfers.length / PER_PAGE)

  //if totalNumberOfPages === 0, set to one so we don't get the strange "Page 1 of 0" display
  if (totalNumberOfPages === 0) totalNumberOfPages = 1

  return (
    <S.HistoryContainer>
      <Pager
        currentPage={page}
        isLastPage={paginatedExits.length < PER_PAGE}
        totalPages={totalNumberOfPages}
        onClickNext={() => setPage(page + 1)}
        onClickBack={() => setPage(page - 1)}
      />

      <Grid item xs={12}>
        <Box>
          <S.Content>
            {!renderTransfers.length && !loading && (
              <S.Disclaimer>Scanning for exits...</S.Disclaimer>
            )}
            {!renderTransfers.length && loading && (
              <S.Disclaimer>Loading...</S.Disclaimer>
            )}
            {React.Children.toArray(paginatedExits)}
          </S.Content>
        </Box>
      </Grid>
    </S.HistoryContainer>
  );
}

export default React.memo(TX_Transfers)
