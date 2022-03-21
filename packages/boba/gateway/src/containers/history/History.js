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
import { batch, useDispatch } from 'react-redux'
import { isEqual, orderBy } from 'lodash'
import { useSelector } from 'react-redux'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

import { Box, useMediaQuery, useTheme } from '@mui/material'

import moment from 'moment'

import Input from 'components/input/Input'

import { setActiveHistoryTab } from 'actions/uiAction'
import { selectActiveHistoryTab } from 'selectors/uiSelector'

import { fetchTransactions } from 'actions/networkAction'
import { selectTransactions } from 'selectors/transactionSelector'
import { selectLayer } from 'selectors/setupSelector'

import Tabs from 'components/tabs/Tabs'

import Exits from './TX_Exits'
import Deposits from './TX_Deposits'
import All from './TX_All'
import Pending from './TX_Pending'

import * as S from './History.styles'
import * as styles from './TX_All.module.scss'

import useInterval from 'util/useInterval'
import PageTitle from 'components/pageTitle/PageTitle'
import WalletPicker from 'components/walletpicker/WalletPicker'
import AlertIcon from 'components/icons/AlertIcon'

import { POLL_INTERVAL } from 'util/constant'

function History() {

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const dispatch = useDispatch()

  const now = new Date()
  const last_6months = new Date(now.getFullYear(), now.getMonth()-6, now.getDate())

  const [startDate, setStartDate] = useState(last_6months)
  const [endDate, setEndDate] = useState(now)
  const layer = useSelector(selectLayer())

  const [searchHistory, setSearchHistory] = useState('')
  const activeTab = useSelector(selectActiveHistoryTab, isEqual)

  const unorderedTransactions = useSelector(selectTransactions, isEqual)
  const orderedTransactions = orderBy(unorderedTransactions, i => i.timeStamp, 'desc')

  const transactions = orderedTransactions.filter((i) => {
    if (startDate && endDate) {
      return (moment.unix(i.timeStamp).isSameOrAfter(startDate) && moment.unix(i.timeStamp).isSameOrBefore(endDate))
    }
    return true
  })

  useInterval(() => {
    batch(()=>{
      dispatch(fetchTransactions())
    })
  }, POLL_INTERVAL)

  return (

    <S.HistoryPageContainer>

      <Box sx={{ my: 1 }}>
        <PageTitle title="History" />
      </Box>

      {!layer &&
        <S.LayerAlert>
          <S.AlertInfo>
            <AlertIcon />
            <S.AlertText
              variant="body2"
              component="p"
            >
              Connect to MetaMask to see your history
            </S.AlertText>
          </S.AlertInfo>
          <WalletPicker />
        </S.LayerAlert>
      }

      {layer && <>
      <S.Header>
        <div className={styles.searchInput}>
          <Input
            size='small'
            placeholder='Search by hash'
            value={searchHistory}
            onChange={i=>{setSearchHistory(i.target.value)}}
            className={styles.searchBar}
          />
        </div>
        <div className={styles.actions}>
          {!isMobile ? (
            <div style={{ margin: '0px 10px', opacity: 0.7 }}>Show period from</div>
          ) : null}
          <DatePicker
            wrapperClassName={styles.datePickerInput}
            popperClassName={styles.popperStyle}
            selected={startDate}
            onChange={(date)=>setStartDate(date)}
            selectsStart
            endDate={new Date(endDate)}
            maxDate={new Date(endDate)}
            calendarClassName={theme.palette.mode}
            placeholderText={isMobile ? "From" : ""}
          />
          {!isMobile ? (
            <div style={{ margin: '0px 10px', opacity: 0.7 }}>to </div>
          ) : null}
          <DatePicker
            wrapperClassName={styles.datePickerInput}
            popperClassName={styles.popperStyle}
            selected={endDate}
            onChange={(date)=>setEndDate(date)}
            selectsEnd
            startDate={new Date(startDate)}
            minDate={new Date(startDate)}
            calendarClassName={theme.palette.mode}
            placeholderText={isMobile ? "To" : ""}
          />
        </div>
      </S.Header>
      <div className={styles.data}>
        <div className={styles.section}>
          <Tabs
            onClick={tab => {dispatch(setActiveHistoryTab(tab))}}
            activeTab={activeTab}
            tabs={['All', 'Bridge to L2', 'Bridge to L1', 'Pending']}
          />

          {activeTab === 'All' && (
            <All
              searchHistory={searchHistory}
              transactions={transactions}
            />
          )}

          {activeTab === 'Bridge to L2' &&
            <Deposits
              searchHistory={searchHistory}
              transactions={transactions}
            />
          }

          {activeTab === 'Bridge to L1' &&
            <Exits
              searchHistory={searchHistory}
              transactions={transactions}
            />
          }

          {activeTab === 'Pending' &&
            <Pending
              searchHistory={searchHistory}
              transactions={transactions}
            />
          }
        </div>
      </div>
    </>}
    </S.HistoryPageContainer>
  );
}

export default React.memo(History)
