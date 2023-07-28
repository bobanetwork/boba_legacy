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

import { useMediaQuery, useTheme } from '@mui/material'
// import Input from 'components/input/Input'
import { Button } from 'components/global'
import { DropdownNetwork } from 'components/global/dropdown/themes'
import transctionService from 'services/transaction.service'
import { NETWORK_TYPE } from 'util/network/network.util'
import {
  ALL_NETWORKS,
  FILTER_OPTIONS,
  TableOptions,
  NETWORK_L1_OPTIONS,
  NETWORK_L2_OPTIONS,
} from './constants'
import MagnifyingGlass from 'images/icons/magnifyingGlass.svg'

import {
  selectTransactions,
  selectAccountEnabled,
  selectLayer,
  selectActiveNetworkName,
} from 'selectors'

import { fetchTransactions } from 'actions/networkAction'

import {
  Actions,
  SearchInput,
  Table,
  NoHistory,
  HistoryPageContainer,
  TableHeader,
  TableFilters,
  NetworkDropdowns,
  Input,
  DatePickerWrapper,
  DateDescriptions,
  Icon,
  MobileDateDescriptions,
  IconContainer,
} from './styles'

import useInterval from 'hooks/useInterval'
import { setConnect } from 'actions/setupAction'

import { POLL_INTERVAL } from 'util/constant'
import FilterIcon from '../../images/filter.svg'

import { TransactionsResolver } from './TransactionsResolver'
import { CHAIN_NAME, TRANSACTION_FILTER_STATUS } from './types'
import { TransactionsTableHeader } from 'components/global/table/themes'
import { FilterDropDown } from 'components/filter'
import noHistoryIcon from 'images/noHistory.svg'
import switchButton from 'images/icons/switchButton.svg'
import { Svg } from 'components/global/svg'

const History = () => {
  const [toNetwork, setToNetwork] = useState(ALL_NETWORKS)
  const [fromNetwork, setFromNetwork] = useState(ALL_NETWORKS)
  const [transactionsFound, setTransactionsFound] = useState(true)
  const [switched, setSwitched] = useState(false)

  const theme = useTheme()

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

  const getDatePicker = (label: string) => {
    const dateSelector = (date: Date) => {
      label === 'To' ? setFilterEndDate(date) : setFilterStartDate(date)
    }
    return (
      <DatePickerWrapper
        selected={label === 'To' ? filterEndDate : filterStartDate}
        onChange={(date: Date) =>
          date && !Array.isArray(date) && dateSelector(date)
        }
        {...(label === 'From' ? { selectsStart: true } : { selectsEnd: true })}
        calendarClassName={theme.palette.mode}
        placeholderText={label}
        {...(label === 'From'
          ? { endDate: new Date(filterEndDate) }
          : {
              startDate: new Date(filterStartDate),
              minDate: new Date(filterStartDate),
            })}
        maxDate={new Date(now)}
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
            <SearchInput // search input
            >
              <Svg src={MagnifyingGlass} />
              <Input // search bar styles
                placeholder="Search Here"
                value={searchHistory}
                onChange={(i: any) => {
                  setSearchHistory(i.target.value)
                }}
              />
            </SearchInput>
            <Actions>
              <MobileDateDescriptions variant="body1">
                Date range
              </MobileDateDescriptions>
              <DateDescriptions variant="body1">
                Date range from
              </DateDescriptions>
              {getDatePicker('From')}
              <DateDescriptions variant="body1">to</DateDescriptions>

              {getDatePicker('To')}
            </Actions>
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
                  <div style={{ fontSize: '16px' }}>From</div>
                  <DropdownNetwork
                    items={switched ? NETWORK_L2_OPTIONS : NETWORK_L1_OPTIONS}
                    defaultItem={fromNetwork}
                    onItemSelected={(option) => setFromNetwork(option)}
                    error={false}
                    headers={[NETWORK_TYPE.MAINNET, NETWORK_TYPE.TESTNET]}
                  />
                  <IconContainer
                    onClick={() => {
                      handleSwitchDropdowns()
                    }}
                  >
                    <Icon src={switchButton} />
                  </IconContainer>
                  <div style={{ fontSize: '16px', paddingLeft: '16px' }}>
                    To
                  </div>
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
              <TransactionsTableHeader
                options={TableOptions}
              ></TransactionsTableHeader>
            </div>
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
