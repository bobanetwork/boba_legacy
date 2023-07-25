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
import { ModalTypography } from 'components/global/modalTypography'
import { Button } from 'components/global'
import { DropdownNetwork } from 'components/global/dropdown/themes'
import transctionService from 'services/transaction.service'
import { ALL_NETWORKS, FILTER_OPTIONS, TableOptions } from './constants'

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
  DatePickerWrapper,
  Input,
} from './styles'

import useInterval from 'hooks/useInterval'
import { setConnect } from 'actions/setupAction'

import { POLL_INTERVAL } from 'util/constant'
import FilterIcon from '../../images/filter.svg'

import {
  TransactionsResolver,
  GetSymbolFromNetworkName,
} from './TransactionsResolver'
import { TRANSACTION_FILTER_STATUS } from './types'
import { TransactionsTableHeader } from 'components/global/table/themes'
import { FilterDropDown } from 'components/filter'
import { getCoinImage } from 'util/coinImage'
import noHistoryIcon from '../../images/noHistory.svg'
import { Svg } from 'components/global/svg'

const History = () => {
  const [toNetwork, setToNetwork] = useState(ALL_NETWORKS)
  const [fromNetwork, setFromNetwork] = useState(ALL_NETWORKS)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const dispatch = useDispatch<any>()
  const now = new Date()
  const last_6months = new Date(
    now.getFullYear(),
    now.getMonth() - 6,
    now.getDate()
  )

  const [filterStartDate, setFilterStartDate] = useState(last_6months)
  const [transactionStatus, setTransactionStatus] = useState('All')
  const [filterEndDate, setFilterEndDate] = useState(now)
  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())

  const [searchHistory, setSearchHistory] = useState('')
  const networkName = useSelector(selectActiveNetworkName())

  const transactions = useSelector(selectTransactions, isEqual)

  const getNetworks = () => {
    return [
      ALL_NETWORKS,
      {
        label: networkName['l1'],
        value: networkName['l1'],
        imgSrc: getCoinImage(GetSymbolFromNetworkName(networkName['l1'])),
      },
      {
        label: networkName['l2'],
        value: networkName['l2'],
        imgSrc: getCoinImage(GetSymbolFromNetworkName(networkName['l2'])),
      },
    ]
  }

  const getDatePicker = (label: string) => {
    const dateSelector = (date: Date) => {
      label === 'To' ? setFilterEndDate(date) : setFilterStartDate(date)
    }
    return (
      <DatePickerWrapper
        selected={label === 'To' ? filterEndDate : filterStartDate}
        onChange={(date) => date && !Array.isArray(date) && dateSelector(date)}
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
              <Input // search bar styles
                placeholder="Search Here"
                value={searchHistory}
                onChange={(i: any) => {
                  setSearchHistory(i.target.value)
                }}
              />
            </SearchInput>
            <Actions>
              {!isMobile ? (
                <ModalTypography variant="body1">
                  Date range from
                </ModalTypography>
              ) : null}
              {getDatePicker('From')}
              {!isMobile ? (
                <ModalTypography variant="body1">to </ModalTypography>
              ) : null}

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
                    items={getNetworks()}
                    defaultItem={fromNetwork}
                    onItemSelected={(option) => {
                      setFromNetwork(option)
                    }}
                    error={false}
                  />
                  <div style={{ fontSize: '16px', paddingLeft: '16px' }}>
                    To
                  </div>
                  <DropdownNetwork
                    items={getNetworks()}
                    defaultItem={toNetwork}
                    onItemSelected={(option) => {
                      setToNetwork(option)
                    }}
                    error={false}
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
            <TransactionsResolver
              transactions={transactions}
              transactionsFilter={{
                fromNetwork: fromNetwork.value || 'All',
                toNetwork: toNetwork.value || 'All',
                status: transactionStatus as TRANSACTION_FILTER_STATUS,
                targetHash: searchHistory,
                startDate: filterStartDate,
                endDate: filterEndDate,
              }}
            ></TransactionsResolver>
          </Table>
        </>
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
