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
import { useSelector } from 'react-redux'
import "react-datepicker/dist/react-datepicker.css"
import { Grid, Box } from '@mui/material'

import moment from 'moment'

import { selectLoading } from 'selectors/loadingSelector'
import { selectTokens } from 'selectors/tokenSelector'
import { logAmount } from 'util/amountConvert'

import Transaction from 'components/transaction/Transaction'
import Pager from 'components/pager/Pager'

import * as S from './History.styles'

const PER_PAGE = 8

function TX_All({ searchHistory, transactions }) {

  const [page, setPage] = useState(1)

  const loading = useSelector(selectLoading(['TRANSACTION/GETALL']))
  const tokenList = useSelector(selectTokens)

  useEffect(() => {
    setPage(1)
  }, [searchHistory])

  const _transactions = transactions.filter(i => {
    return i.hash.includes(searchHistory)
  })

  const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE)
  const endingIndex = page * PER_PAGE
  const paginatedTransactions = _transactions.slice(startingIndex, endingIndex)

  let totalNumberOfPages = Math.ceil(_transactions.length / PER_PAGE)

  //if totalNumberOfPages === 0, set to one so we don't get the strange "page 1 of 0" display
  if (totalNumberOfPages === 0) totalNumberOfPages = 1

  return (
    <S.HistoryContainer>
      <Pager
        currentPage={page}
        isLastPage={paginatedTransactions.length < PER_PAGE}
        totalPages={totalNumberOfPages}
        onClickNext={() => setPage(page + 1)}
        onClickBack={() => setPage(page - 1)}
      />
      <Grid item xs={12}>
        <Box>
          <S.Content>
            {!paginatedTransactions.length && !loading && (
              <S.Disclaimer>Scanning for transactions...</S.Disclaimer>
            )}
            {!paginatedTransactions.length && loading && (
              <S.Disclaimer>Loading...</S.Disclaimer>
            )}
            {paginatedTransactions.map((i, index) => {
                
              let metaData = ''

              if(i.crossDomainMessage && i.crossDomainMessage.fast === 1) {
                metaData = 'Fast Bridge'
              } else if (i.crossDomainMessage && i.crossDomainMessage.fast === 0) {
                metaData = 'Classic Bridge'
              }
              
              let annotation = ''

              if(metaData === '' && typeof(i.activity) === 'undefined') {
                //annotation = 'No Idea'
              } else if (typeof(i.activity) === 'undefined') {
                //we only have metaData
                annotation = metaData
              } else if (metaData === '') {
                //we only have activity
                annotation = i.activity
              } else {
                //we have both
                annotation = `${metaData} (${i.activity})`
              }

              const time = moment.unix(i.timeStamp).format('lll')
              const chain = (i.chain === 'L1pending') ? 'L1' : i.chain
              
              let details = null
              let amountTx = null

              if (i.action && i.action.token) {
                let token = tokenList[i.action.token.toLowerCase()];
                if (chain === 'L2') {
                  token = Object.values(tokenList).find(t => t.addressL2.toLowerCase() === i.action.token.toLowerCase());
                }
                if (!!token) {
                  let amount = logAmount(i.action.amount, token.decimals, 3);
                  let symbol = token[`symbol${chain}`];
                  amountTx = `${amount} ${symbol}`;
                }
              }

              if( i.crossDomainMessage && i.crossDomainMessage.l1BlockHash ) {
                details = {
                  blockHash: i.crossDomainMessage.l1BlockHash,
                  blockNumber: i.crossDomainMessage.l1BlockNumber,
                  from: i.crossDomainMessage.l1From,
                  hash: i.crossDomainMessage.l1Hash,
                  to: i.crossDomainMessage.l1To,
                }
              }

              if( i.crossDomainMessage && i.crossDomainMessage.l2BlockHash ) {
                details = {
                  blockHash: i.crossDomainMessage.l2BlockHash,
                  blockNumber: i.crossDomainMessage.l2BlockNumber,
                  from: i.crossDomainMessage.l2From,
                  hash: i.crossDomainMessage.l2Hash,
                  to: i.crossDomainMessage.l2To,
                }
              }

              return (
                <Transaction
                  key={index}
                  title={`${chain} Hash: ${i.hash}`}
                  time={time}
                  blockNumber={`Block ${i.blockNumber}`}
                  chain={`${chain} Chain`}
                  typeTX={annotation === '' ? `` : `TX Type: ${annotation}`}
                  detail={details}
                  oriChain={chain}
                  oriHash={i.hash}
                  amountTx={amountTx}
                />
              )
            })}
          </S.Content>
        </Box>
      </Grid>
    </S.HistoryContainer>
  )
}

export default React.memo(TX_All)
