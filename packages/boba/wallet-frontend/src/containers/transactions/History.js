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

import {useMediaQuery, useTheme} from '@material-ui/core'
import moment from 'moment';

import { setActiveHistoryTab1 } from 'actions/uiAction'
import { fetchTransactions } from 'actions/networkAction'

import { selectActiveHistoryTab1 } from 'selectors/uiSelector'
import { selectTransactions } from 'selectors/transactionSelector'

import Tabs from 'components/tabs/Tabs'
import Input from 'components/input/Input'

import Exits from './Exits'
import Deposits from './Deposits'

import * as styles from './Transactions.module.scss'
import * as S from './History.styles'

import useInterval from 'util/useInterval'
import PageHeader from 'components/pageHeader/PageHeader'
import Transactions from './Transactions'

import { POLL_INTERVAL } from 'util/constant'

function History() {

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const dispatch = useDispatch()

  const now = new Date()
  const last_week = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)

  const [startDate, setStartDate] = useState(last_week)
  const [endDate, setEndDate] = useState(now)

  const [searchHistory, setSearchHistory] = useState('')

  const activeTab1 = useSelector(selectActiveHistoryTab1, isEqual)

  const unorderedTransactions = useSelector(selectTransactions, isEqual)

  //sort transactions by timeStamp
  const orderedTransactions = orderBy(unorderedTransactions, i => i.timeStamp, 'desc')

  const transactions = orderedTransactions.filter((i) => {
    if (startDate && endDate) {
      return (moment.unix(i.timeStamp).isSameOrAfter(startDate) && moment.unix(i.timeStamp).isSameOrBefore(endDate));
    }
    return true;
  })

  useInterval(() => {
    batch(() => {
      dispatch(fetchTransactions());
    });
  }, POLL_INTERVAL);

  console.log(startDate)
  console.log(endDate)

  return (
    <>
      <PageHeader title="Transaction History" />

      <S.Header>
        <div className={styles.searchInput}>
          <Input
            size='small'
            placeholder='Search by hash'
            value={searchHistory}
            onChange={i => {
              setSearchHistory(i.target.value);
            }}
            className={styles.searchBar}
          />
        </div>
        <div className={styles.actions}>
          {!isMobile ? (
            <div style={{ margin: '0px 10px', opacity: 0.7 }}>Show period from</div>
          ) : null}
          <DatePicker
            wrapperClassName={styles.datePickerInput}
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            endDate={new Date(endDate)}
            maxDate={new Date(endDate)}
            calendarClassName={theme.palette.mode}
            placeholderText={isMobile ? "From" : ""}
            popperClassName={styles.popperStyle}
          />
          {!isMobile ? (
            <div style={{ margin: '0px 10px', opacity: 0.7 }}>to </div>
          ) : null}
          <DatePicker
            wrapperClassName={styles.datePickerInput}
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={new Date(startDate)}
            minDate={new Date(startDate)}
            calendarClassName={theme.palette.mode}
            placeholderText={isMobile ? "To" : ""}
            popperClassName={styles.popperStyle}
          />
        </div>
      </S.Header>
      <div className={styles.data}>
        <div className={styles.section}>
          <Tabs
            onClick={tab => {dispatch(setActiveHistoryTab1(tab))}}
            activeTab={activeTab1}
            tabs={['All', 'Bridge to L2', 'Bridge to L1']}
          />

          {activeTab1 === 'All' && (
            <Transactions
              searchHistory={searchHistory}
              transactions={transactions}
            />
          )}

          {activeTab1 === 'Bridge to L2' &&
            <Deposits
              searchHistory={searchHistory}
              transactions={transactions}
            />
          }

          {activeTab1 === 'Bridge to L1' &&
            <Exits
              searchHistory={searchHistory}
              transactions={transactions}
            />
          }
        </div>
      </div>
    </>
  );
}

export default React.memo(History);
