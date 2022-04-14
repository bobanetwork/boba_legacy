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

import { orderBy } from 'lodash'
// import { selectNetwork } from 'selectors/setupSelector'

// import { getNetwork } from 'util/masterConfig'

import moment from 'moment'

import { selectLoading } from 'selectors/loadingSelector'
import { selectTokens } from 'selectors/tokenSelector'
import { logAmount } from 'util/amountConvert'

import Transaction from 'components/transaction/Transaction'
import Pager from 'components/pager/Pager'

import * as S from './History.styles'

const PER_PAGE = 8

function TX_Pending({ searchHistory, transactions }) {

    const [page, setPage] = useState(1)

    const loading = useSelector(selectLoading(['TRANSACTION/GETALL']))
    const tokenList = useSelector(selectTokens)

    useEffect(() => {
      setPage(1)
    }, [searchHistory])

    const pending = transactions.filter((i) => {
        if (i.crossDomainMessage &&
            i.crossDomainMessage.crossDomainMessage === 1 &&
            i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
            i.action.status === "pending"
        ) {
            return true
        }
        return false
    })

    let pendingL1 = pending.filter((i) => {
        if (i.chain === 'L1pending') return true
        return false
    })

    let pendingL2 = pending.filter((i) => {
        if (i.chain === 'L2') return true
        return false
    })

    //Part 1 - exit that is not final and we do not have a state root hash yet
    let pendingExitsStage0 = pendingL2.filter((i) => {
        if (!i.stateRoot.stateRootHash && i.action.fast) return true
        return false
    })
    pendingExitsStage0 = pendingExitsStage0.map(v => ({
        ...v,label: 'Bridge to L1',labelStatus: 'Step 0, No SR Hash yet, Pending',
        completion: v.crossDomainMessage.crossDomainMessageEstimateFinalizedTime,
      })
    )

    //Part 2 - exit that is not final, but we have a state root hash
    let pendingExitsStage1 = pendingL2.filter((i) => {
        if (i.stateRoot.stateRootHash && i.action.fast) return true
        return false
    })
    pendingExitsStage1 = pendingExitsStage1.map(v => ({
        ...v, label: 'Bridge to L1', labelStatus: 'Step 1, Have SR Hash, Pending',
        completion: v.crossDomainMessage.crossDomainMessageEstimateFinalizedTime,
      })
    )

    //Part 3 - exit that is not final, but we have a state root hash, and we ARE NOT using the fast message relayer
    //so this is a traditional exit
    let pendingExitsTrad = pendingL2.filter((i) => {
        if (!i.action.fast) return true
        return false
    })
    pendingExitsTrad = pendingExitsTrad.map(v => ({
        ...v,label: 'Classic 7-day Bridge to L1',labelStatus: 'In 7 day window',
        completion: v.crossDomainMessage.crossDomainMessageEstimateFinalizedTime,
      })
    )

    //DEPOSIT Part 1 - deposit that is not final and we do not have a state root hash yet
    let pendingDepositsFast = pendingL1.filter((i) => {
        if (i.action.fast) return true
        return false
    })
    pendingDepositsFast = pendingDepositsFast.map(v => ({
        ...v,label: 'Bridge to L2',labelStatus: 'Pending',
        completion: v.crossDomainMessage.crossDomainMessageEstimateFinalizedTime,
      })
    )

    //DEPOSIT Part 3 - we ARE NOT using the fast message relayer
    //so this is a traditional deposit
    let pendingDepositsTrad = pendingL1.filter((i) => {
        if (!i.action.fast) return true
        return false
    })
    pendingDepositsTrad = pendingDepositsTrad.map(v => ({
        ...v, label: 'Classic Bridge to L2', labelStatus: 'Pending',
        completion: v.crossDomainMessage.crossDomainMessageEstimateFinalizedTime,
      })
    )

    let pendingTransactions = [
        ...pendingExitsTrad,
        ...pendingExitsStage0,
        ...pendingExitsStage1,
        ...pendingDepositsTrad,
        ...pendingDepositsFast
    ]

      // combine the batch onramp
      pendingTransactions = pendingTransactions.reduce((acc, cur) => {
      const index = acc.findIndex(i => i.blockNumber === cur.blockNumber)
      if (index !== -1) {
        acc[index].action = [...acc[index].action, cur.action]
        acc[index].label = 'Bridge to L2 In Batch'
      } else {
        cur.action = [cur.action]
        acc.push(cur)
      }
      return acc
    }, [])

    const orderedTransactions = orderBy(pendingTransactions, i => i.timeStamp, 'desc')

    const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE)
    const endingIndex = page * PER_PAGE
    const paginatedTransactions = orderedTransactions.slice(startingIndex, endingIndex)

    let totalNumberOfPages = Math.ceil(orderedTransactions.length / PER_PAGE)

    //if totalNumberOfPages === 0, set to one so we don't get the strange "page 1 of 0" display
    if (totalNumberOfPages === 0) totalNumberOfPages = 1

    // const currentNetwork = useSelector(selectNetwork())
    // const nw = getNetwork()

    // const chainLink = (item) => {
    //     let network = nw[currentNetwork]
    //     let chain = item.chain === 'L1pending' ? 'L1' : item.chain;
    //     if (!!network && !!network[chain]) {
    //         return `${network[chain].transaction}${item.hash}`;
    //     }
    //     return '';
    // }

    console.log("PendingToShow:", paginatedTransactions)

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
              <S.Disclaimer>Scanning for pending transactions...</S.Disclaimer>
            )}
            {!paginatedTransactions.length && loading && (
              <S.Disclaimer>Loading...</S.Disclaimer>
            )}
            {paginatedTransactions.map((i, index) => {

                let completionTime = 'Not available'

                if(i.completion)
                    completionTime = moment.unix(i.completion).format('lll')

                const chain = (i.chain === 'L1pending') ? 'L1' : i.chain

                let amountTx = ''

                for (const payload of i.action) {
                  if (payload.token) {
                    let token = tokenList[payload.token.toLowerCase()];
                    if (chain === 'L2') {
                        token = Object.values(tokenList).find(t => t.addressL2.toLowerCase() === payload.token.toLowerCase());
                    }
                    if (!!token) {
                        let amount = logAmount(payload.amount, token.decimals, 3);
                        let symbol = token[`symbol${chain}`];
                        amountTx += `${amount} ${symbol} `;
                    }
                  }
                }

                let annotation = ''
                if(typeof(i.label) === 'undefined') {
                  //annotation = 'No Idea'
                } else {
                  annotation = i.label
                }

                let completion = ''
                if(typeof(i.labelStatus) === 'undefined') {
                  //status = 'No Idea'
                } else {
                  completion = i.labelStatus + ' - Completion time: ' + completionTime
                }

                const time = moment.unix(i.timeStamp).format('lll')

                return (
                    <Transaction
                      key={index}
                      title={`${chain} Hash: ${i.hash}`}
                      time={time}
                      blockNumber={`Block ${i.blockNumber}`}
                      chain={`${chain} Chain`}
                      typeTX={annotation === '' ? `` : `TX Type: ${annotation}`}
                      oriChain={chain}
                      oriHash={i.hash}
                      amountTx={amountTx}
                      completion={completion}
                    />
                )
            })}
          </S.Content>
        </Box>
      </Grid>
    </S.HistoryContainer>

  )
}

export default React.memo(TX_Pending)
