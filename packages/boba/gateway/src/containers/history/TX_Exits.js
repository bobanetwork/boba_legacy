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

import React, { useState } from 'react'
import {Grid, Box} from '@mui/material'
import moment from 'moment'
import { useSelector } from 'react-redux'

import { selectLoading } from 'selectors/loadingSelector'
import { selectTokens } from 'selectors/tokenSelector'

import { logAmount } from 'util/amountConvert'

import Transaction from 'components/transaction/Transaction'
import Pager from 'components/pager/Pager'

import networkService from 'services/networkService'

import * as S from './History.styles'

const PER_PAGE = 8

function TX_Exits({ searchHistory, transactions, chainLink }) {

  const [page, setPage] = useState(1)
  const loading = useSelector(selectLoading(['EXIT/GETALL']))
  const tokenList = useSelector(selectTokens)
  const allAddresses = networkService.getAllAddresses()
  
  const _exits = transactions.filter(i => {
    return i.hash.includes(searchHistory) && i.to !== null && i.exitL2
  })

  const renderExits = _exits.map((i, index) => {
    
    const chain = (i.chain === 'L1pending') ? 'L1' : i.chain
    
    let metaData = ''

    //i.crossDomainMessage.fast can be either 1 or null,
    //where null denotes the classic 7 day exit 

    if(i.crossDomainMessage.fast === 1) {
      metaData = 'Fast Bridge'
    } else if (i.crossDomainMessage.fast === null) {
      metaData = 'Classic 7-day Bridge'
    }

    let isExitable = false
    let details = null

    let timeLabel = moment.unix(i.timeStamp).format('lll')

    const to = i.to.toLowerCase()

    let amountTx = null;
    
    if (i.action && i.action.token) {
      const token = Object.values(tokenList).find(t => t.addressL2.toLowerCase() === i.action.token.toLowerCase());
      if (!!token) {
        let amount = logAmount(i.action.amount, token.decimals, 3);
        let symbol = token[`symbol${chain}`];
        amountTx = `${amount} ${symbol}`;
      }
    }

    //are we dealing with a traditional exit?
    if (to === allAddresses.L2StandardBridgeAddress.toLowerCase()) {

      isExitable = moment().isAfter(moment.unix(i.crossDomainMessage.crossDomainMessageEstimateFinalizedTime))

      if (isExitable) {
        timeLabel = 'Funds were exited to L1 after ' + moment.unix(i.crossDomainMessage.crossDomainMessageEstimateFinalizedTime).format('lll')
      } else {
        const secondsToGo = i.crossDomainMessage.crossDomainMessageEstimateFinalizedTime - Math.round(Date.now() / 1000)
        const daysToGo = Math.floor(secondsToGo / (3600 * 24))
        const hoursToGo = Math.round((secondsToGo % (3600 * 24)) / 3600)
        const time = moment.unix(i.timeStamp).format('MM/DD/YYYY hh:mm a')//.format("mm/dd hh:mm")
        timeLabel = `7 day window started ${time}. ${daysToGo} days and ${hoursToGo} hours remaining`
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

    return (
      <Transaction
        key={`${index}`}
        chain='Bridge to L1'
        title={`${chain} Hash: ${i.hash}`}
        blockNumber={`Block ${i.blockNumber}`}
        time={timeLabel}
        button={undefined}
        typeTX={`TX Type: ${metaData}`}
        detail={details}
        oriChain={chain}
        oriHash={i.hash}
        amountTx={amountTx}
      />
    )
  })

  const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE)
  const endingIndex = page * PER_PAGE
  const paginatedExits = renderExits.slice(startingIndex, endingIndex)

  let totalNumberOfPages = Math.ceil(renderExits.length / PER_PAGE)

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
            {!renderExits.length && !loading && (
              <S.Disclaimer>Scanning for exits...</S.Disclaimer>
            )}
            {!renderExits.length && loading && (
              <S.Disclaimer>Loading...</S.Disclaimer>
            )}
            {React.Children.toArray(paginatedExits)}
          </S.Content>
        </Box>
      </Grid>
    </S.HistoryContainer>
  );
}

export default React.memo(TX_Exits)
