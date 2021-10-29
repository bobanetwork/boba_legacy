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
import { selectTokens } from 'selectors/tokenSelector'

import { logAmount } from 'util/amountConvert'

import Pager from 'components/pager/Pager'
import Transaction from 'components/transaction/Transaction'

import networkService from 'services/networkService'

import * as styles from './Transactions.module.scss'
import * as S from './History.styles';

const PER_PAGE = 10;

function Deposits({ searchHistory, transactions }) {

  const [page, setPage] = useState(1)

  const loading = useSelector(selectLoading(['TRANSACTION/GETALL']))
  const tokenList = useSelector(selectTokens)

  const allAddresses = networkService.getAllAddresses()

  useEffect(() => {
    setPage(1)
  }, [searchHistory])

  const _deposits = transactions.filter(i => {
    return i.hash.includes(searchHistory) && i.to !== null && i.depositL2 
  })

  const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE);
  const endingIndex = page * PER_PAGE;
  const paginatedDeposits = _deposits.slice(startingIndex, endingIndex);

  let totalNumberOfPages = Math.ceil(_deposits.length / PER_PAGE);

  //if totalNumberOfPages === 0, set to one so we don't get the strange "page 1 of 0" display
  if (totalNumberOfPages === 0) totalNumberOfPages = 1

  return (
    <div className={styles.transactionSection}>
      <S.HistoryContainer>
        <Pager
          currentPage={page}
          isLastPage={paginatedDeposits.length < PER_PAGE}
          totalPages={totalNumberOfPages}
          onClickNext={()=>setPage(page + 1)}
          onClickBack={()=>setPage(page - 1)}
        />

        <Grid item xs={12}>
          <Box>
            <S.Content>
              {!paginatedDeposits.length && !loading && (
                <div className={styles.disclaimer}>Scanning for deposits...</div>
              )}
              {!paginatedDeposits.length && loading && (
                <div className={styles.disclaimer}>Loading deposits...</div>
              )}
              {paginatedDeposits.map((i, index) => {
                
                //const typeTX = typeof(i.typeTX) === 'undefined' ? '' : i.typeTX
                //const activity = typeof(i.activity) === 'undefined' ? '' : ' (' + i.activity + ')'
                //let metaData = typeTX + ' ' + activity
                
                const chain = (i.chain === 'L1pending') ? 'L1' : i.chain

                let details = null
                let amountTx = null

                let metaData = ''

                if(i.crossDomainMessage.fast === 1) {
                  metaData = 'Fast Bridge'
                } else if (i.crossDomainMessage.fast === 0) {
                  metaData = 'Classic Bridge'
                }

                if (i.action && i.action.token) {
                  const token = tokenList[i.action.token.toLowerCase()];
                  if (!!token) {
                    let amount = logAmount(i.action.amount, token.decimals, 3);
                    let symbol = token[`symbol${chain}`];
                    amountTx = `${amount} ${symbol}`;
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
                    title={`Hash: ${i.hash}`}
                    time={moment.unix(i.timeStamp).format('lll')}
                    blockNumber={`Block ${i.blockNumber}`}
                    chain={`Bridge to L2`}
                    typeTX={`TX Type: ${metaData}`}
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
    </div>
  );
}

export default React.memo(Deposits);
