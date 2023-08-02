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

import React, { useState } from 'react'
import { isEqual,orderBy } from 'util/lodash';

import { useSelector, useDispatch } from 'react-redux'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { useMediaQuery, useTheme } from '@mui/material'
import {isSameOrAfterDate, isSameOrBeforeDate} from 'util/dates'
import Input from 'components/input/Input'

import { setActiveHistoryTab } from 'actions/uiAction'
import {
  selectActiveHistoryTab,
  selectTransactions,
  selectAccountEnabled,
  selectLayer,
  selectActiveNetworkName
} from 'selectors'

import { fetchTransactions } from 'actions/networkAction'

import Exits from './TX_Exits'
import Deposits from './TX_Deposits'
import All from './TX_All'
import Pending from './TX_Pending'
import Transfers from './TX_Transfers'

import * as S from './History.styles'
import styles from './TX_All.module.scss'

import useInterval from 'hooks/useInterval'
import Connect from 'containers/connect/Connect'
import Tabs from 'components/tabs/Tabs'

import { POLL_INTERVAL } from 'util/constant'

function History() {

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const dispatch = useDispatch()

  const now = new Date()
  const last_6months = new Date(
    now.getFullYear(),
    now.getMonth() - 6,
    now.getDate()
  )

  const [startDate, setStartDate] = useState(last_6months)
  const [endDate, setEndDate] = useState(now)
  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())

  const [searchHistory, setSearchHistory] = useState('')
  const activeTab = useSelector(selectActiveHistoryTab, isEqual)
  const networkName = useSelector(selectActiveNetworkName())

  const unorderedTransactions = useSelector(selectTransactions, isEqual)
  const orderedTransactions = orderBy(
    unorderedTransactions,
    (i) => i.timeStamp,
    'desc'
  )

  const transactions = orderedTransactions.filter((i) => {
    if (startDate && endDate) {
      return (
        isSameOrAfterDate(i.timeStamp, startDate) &&
        isSameOrBeforeDate(i.timeStamp,endDate)
      )
    }
    return true
  })

  useInterval(() => {
    if (accountEnabled) {
      dispatch(fetchTransactions())
    }
  }, POLL_INTERVAL)

  return (
    <S.HistoryPageContainer>

      <Connect
        userPrompt={'Connect to MetaMask to see your history'}
        accountEnabled={layer}
      />

      {layer && (
        <>
          <S.Header>
            <div className={styles.searchInput}>
              <Input
                size="small"
                placeholder="Search by hash"
                value={searchHistory}
                onChange={(i) => {
                  setSearchHistory(i.target.value)
                }}
                className={styles.searchBar}
              />
            </div>
            <div className={styles.actions}>
              {!isMobile ? (
                <div style={{ margin: '0px 10px', opacity: 0.7 }}>
                  Show period from
                </div>
              ) : null}
              <DatePicker
                wrapperClassName={theme.palette.mode === "light" ? styles.datePickerInput : styles.datePickerInputDark}
                popperClassName={styles.popperStyle}
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                endDate={new Date(endDate)}
                maxDate={new Date(endDate)}
                calendarClassName={theme.palette.mode}
                placeholderText={isMobile ? 'From' : ''}
              />
              {!isMobile ? (
                <div style={{ margin: '0px 10px', opacity: 0.7 }}>to </div>
              ) : null}
              <DatePicker
                wrapperClassName={theme.palette.mode === "light" ? styles.datePickerInput : styles.datePickerInputDark}
                popperClassName={styles.popperStyle}
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={new Date(startDate)}
                minDate={new Date(startDate)}
                calendarClassName={theme.palette.mode}
                placeholderText={isMobile ? 'To' : ''}
              />
            </div>
          </S.Header>
          <div className={styles.data}>
            <div className={styles.section}>
              <Tabs
                onClick={(tab) => {
                  dispatch(setActiveHistoryTab(tab))
                }}
                activeTab={activeTab}
                tabs={[
                  'All',
                  `${networkName['l1']} to ${networkName['l2']}`,
                  `${networkName['l2']} to ${networkName['l1']}`,
                  'Bridge between L1s',
                  'Pending',
                ]}
              />

              {activeTab === 'All' && (
                <All
                  searchHistory={searchHistory}
                  transactions={transactions}
                />
              )}

              {activeTab === `${networkName['l1']} to ${networkName['l2']}` && (
                <Deposits
                  searchHistory={searchHistory}
                  transactions={transactions}
                />
              )}

              {activeTab === `${networkName['l2']} to ${networkName['l1']}` && (
                <Exits
                  searchHistory={searchHistory}
                  transactions={transactions}
                />
              )}

              {activeTab === 'Bridge between L1s' && (
                <Transfers
                  searchHistory={searchHistory}
                  transactions={transactions}
                />
              )}

              {activeTab === 'Pending' && (
                <Pending
                  searchHistory={searchHistory}
                  transactions={transactions}
                />
              )}
            </div>
          </div>
        </>
      )}
    </S.HistoryPageContainer>
  )
}

export default React.memo(History)
