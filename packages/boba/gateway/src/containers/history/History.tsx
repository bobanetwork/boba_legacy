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
import { useDispatch, useSelector } from 'react-redux'
import { isEqual } from 'util/lodash'
import { ValidValuesFromArray } from 'util/objectManipulation'

import { useTheme } from 'styled-components'

import { Button } from 'components/global'

import transctionService from 'services/transaction.service'
import { NETWORK_TYPE } from 'util/network/network.util'
import {
  ALL_NETWORKS,
  FILTER_OPTIONS,
  NETWORK_L1_OPTIONS,
  NETWORK_L2_OPTIONS,
  TableOptions,
} from './constants'

import {
  selectAccountEnabled,
  selectLayer,
  selectTransactions,
} from 'selectors'

import { fetchTransactions } from 'actions/networkAction'

import {
  Table,
  NoHistory,
  HistoryPageContainer,
  TableHeader,
  TableFilters,
  NetworkDropdowns,
  DateDescriptions,
  SwitchChainIcon,
  SwitchIcon,
  TableTransactionsContainer,
  DatePickerWrapper,
  DropdownNetwork,
  MobileDateDescriptions,
  MobileDatePickerWrapper,
} from './styles'

import { setConnect } from 'actions/setupAction'
import useInterval from 'hooks/useInterval'

import { POLL_INTERVAL } from 'util/constant'

import FilterIcon from 'assets/images/filter.svg'
import noHistoryIcon from 'assets/images/noHistory.svg'
import { FilterDropDown } from 'components/filter'
import { Svg } from 'components/global/svg'
import { TransactionsTableHeader } from 'components/global/table/themes'
import { TransactionsResolver } from './TransactionsResolver'
import { CHAIN_NAME, TRANSACTION_FILTER_STATUS } from './types'
import { SearchInput } from 'components/global/searchInput'

import { Typography } from 'components/global/typography'
import DatePicker from './DatePicker'

const History = () => {
  const [toNetwork, setToNetwork] = useState(ALL_NETWORKS)
  const [fromNetwork, setFromNetwork] = useState(ALL_NETWORKS)
  const [transactionsFound, setTransactionsFound] = useState(true)
  const [switched, setSwitched] = useState(false)

  const theme: any = useTheme()

  const dispatch = useDispatch<any>()

  const now = new Date()
  const last_6months = new Date(
    now.getFullYear(),
    now.getMonth() - 6,
    now.getDate()
  )
  const handleSwitchDropdowns = () => {
    const temp = fromNetwork
    setFromNetwork(toNetwork)
    setToNetwork(temp)
    setSwitched((current) => !current)
  }

  const [filterStartDate, setFilterStartDate] = useState(last_6months)
  const [transactionStatus, setTransactionStatus] = useState('All')
  const [filterEndDate, setFilterEndDate] = useState(now)
  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())

  const [searchHistory, setSearchHistory] = useState('')

  const transactions = useSelector(selectTransactions, isEqual)

  // TODO: not working as implementation needs be rewrite.
  const getDatePicker = (label: string, range: boolean = false) => {
    const dateSelector = (date: Date) => {
      label === 'To' ? setFilterEndDate(date) : setFilterStartDate(date)
    }
    return (
      <DatePicker
        selected={label === 'To' ? filterEndDate : filterStartDate}
        onChange={(date: Date) =>
          date && !Array.isArray(date) && dateSelector(date)
        }
        timeFormat="MM/DD/YYYY"
        range={range}
        {...(range
          ? { onChangeFrom: setFilterStartDate, onChangeTo: setFilterEndDate }
          : {})}
        {...(label === 'To'
          ? { minDate: filterStartDate }
          : { maxDate: filterEndDate })}
      />
    )
  }
  const syncTransactions = async () => {
    if (accountEnabled) {
      const newTransactions = await transctionService.getTransactions()
      if (newTransactions.length === 0) {
        setTransactionsFound(false)
      } else {
        setTransactionsFound(true)
      }
      if (
        new Set(ValidValuesFromArray(transactions)).size !==
        new Set(newTransactions).size
      ) {
        dispatch(fetchTransactions())
      }
    }
  }

  useInterval(async () => {
    await syncTransactions()
  }, POLL_INTERVAL)

  return (
    <HistoryPageContainer>
      {layer && (
        <>
          <TableHeader>
            <SearchInput
              placeholder="Search Here"
              value={searchHistory}
              onChange={(i: any) => {
                setSearchHistory(i.target.value)
              }}
            />
            <DatePickerWrapper>
              <DateDescriptions variant="body2">
                Date Range From
              </DateDescriptions>
              {getDatePicker('From')}
              <DateDescriptions variant="body2">To</DateDescriptions>
              {getDatePicker('To')}
            </DatePickerWrapper>
            <MobileDatePickerWrapper>
              <MobileDateDescriptions variant="body2">
                Date Range
              </MobileDateDescriptions>
              {getDatePicker('', true)}
            </MobileDatePickerWrapper>
          </TableHeader>

          <Table>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <TableFilters
                style={{
                  width: '100%',
                }}
              >
                <NetworkDropdowns>
                  <Typography variant="body2">From</Typography>
                  <DropdownNetwork
                    items={switched ? NETWORK_L2_OPTIONS : NETWORK_L1_OPTIONS}
                    defaultItem={fromNetwork}
                    onItemSelected={(option) => setFromNetwork(option)}
                    error={false}
                    headers={[NETWORK_TYPE.MAINNET, NETWORK_TYPE.TESTNET]}
                  />
                  <SwitchChainIcon
                    onClick={() => {
                      handleSwitchDropdowns()
                    }}
                  >
                    <SwitchIcon />
                  </SwitchChainIcon>
                  <Typography variant="body2">To</Typography>
                  <DropdownNetwork
                    items={switched ? NETWORK_L1_OPTIONS : NETWORK_L2_OPTIONS}
                    defaultItem={toNetwork}
                    onItemSelected={(option) => setToNetwork(option)}
                    error={false}
                    headers={[NETWORK_TYPE.MAINNET, NETWORK_TYPE.TESTNET]}
                  />
                </NetworkDropdowns>
                <FilterDropDown
                  items={FILTER_OPTIONS}
                  defaultItem={FILTER_OPTIONS[0]}
                  imgSrc={FilterIcon}
                  onItemSelected={(item) => {
                    setTransactionStatus(item.value)
                  }}
                  error={false}
                />
              </TableFilters>
            </div>
            <TableTransactionsContainer>
              <TransactionsTableHeader
                options={TableOptions}
              ></TransactionsTableHeader>
              {transactionsFound && (
                <TransactionsResolver
                  transactions={transactions}
                  transactionsFilter={{
                    fromNetworkChainId: fromNetwork.value as CHAIN_NAME,
                    toNetworkChainId: toNetwork.value as CHAIN_NAME,
                    status: transactionStatus as TRANSACTION_FILTER_STATUS,
                    targetHash: searchHistory,
                    startDate: filterStartDate,
                    endDate: filterEndDate,
                  }}
                ></TransactionsResolver>
              )}
            </TableTransactionsContainer>
          </Table>
        </>
      )}
      {!transactionsFound && (
        <NoHistory
          style={{ marginLeft: 'auto', marginRight: 'auto', padding: '20px' }}
        >
          <Svg src={noHistoryIcon} />
          <div>No Transactions Found.</div>
        </NoHistory>
      )}
      {!layer && (
        <NoHistory
          style={{ marginLeft: 'auto', marginRight: 'auto', padding: '20px' }}
        >
          <Svg src={noHistoryIcon} />
          <div>No History.</div>
          <Button
            onClick={() => dispatch(setConnect(true))}
            small
            label="Connect Wallet"
          />
        </NoHistory>
      )}
    </HistoryPageContainer>
  )
}

export default React.memo(History)
