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

import React, { useEffect, useState } from 'react'
import * as G from '../Global.styles'
import { useDispatch } from 'react-redux'
import { isEqual, orderBy } from 'util/lodash'

import { useSelector } from 'react-redux'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { useMediaQuery, useTheme } from '@mui/material'
import Input from 'components/input/Input'
import Button from 'components/button/Button.js'
import { DropdownNetwork } from 'components/global/dropdown/themes'
import { L1_ICONS, L2_ICONS } from 'util/network/network.util'
import transctionService from 'services/transaction.service'

import { setActiveHistoryTab } from 'actions/uiAction'
import {
  selectActiveHistoryTab,
  selectTransactions,
  selectAccountEnabled,
  selectLayer,
} from 'selectors'

import { fetchTransactions } from 'actions/networkAction'
import { formatDate } from 'util/dates'

import * as S from './History.styles'
import styles from './TX_All.module.scss'
import { Table } from './styles'

import useInterval from 'hooks/useInterval'
import Connect from 'containers/connect/Connect'
import Tabs from 'components/tabs/Tabs'
import Select from 'components/select/Select'
import { setConnectBOBA, setConnect } from 'actions/setupAction'

import { POLL_INTERVAL } from 'util/constant'
import { selectActiveNetworkName, selectActiveNetworkIcon } from 'selectors'
// import { IDropdownItem } from 'components/global/dropdown/types'
import AvalancheIcon from '../../images/avax.svg'
import BNBIcon from '../../images/bnb.svg'
import EthereumIcon from '../../images/ethereumFlex.svg'
import FantomIcon from '../../images/ftm.svg'
import FilterIcon from '../../images/filter.svg'
import AllNetworksIcon from '../../images/allNetworks.svg'
import { TableHeader } from 'components/global/table/index.tsx'
import { element } from 'prop-types'
import { TransactionsResolver } from './TransactionsResolver'
import { TransactionsTableHeader } from 'components/global/table/themes'
import { FilterDropDown } from 'components/filter'

const DEFAULT_NETWORK = {
  value: 'All',
  label: 'All Networks',
  imgSrc: AllNetworksIcon,
}
const FILTER_OPTIONS = [
  { value: 'All', label: 'All Status' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Canceled', label: 'Canceled' },
]

const TableOptions = [
  {
    name: 'Date',
    width: 168,
    tooltip: '',
  },
  {
    name: 'From',
    width: 142,
    tooltip: '',
  },
  {
    name: 'To',
    width: 142,
    tooltip: '',
  },
  {
    name: 'Token',
    width: 90,
    tooltip: '',
  },
  { name: 'Amount', width: 80, tooltip: '' },
  { name: 'Status', width: 88, tooltip: '' },
]

function History() {
  const [toNetwork, setToNetwork] = useState(DEFAULT_NETWORK)
  const [fromNetwork, setFromNetwork] = useState(DEFAULT_NETWORK)

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
  const [transactionStatus, setTransactionStatus] = useState('All')
  const [endDate, setEndDate] = useState(now)
  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())

  const [searchHistory, setSearchHistory] = useState('')
  const networkName = useSelector(selectActiveNetworkName())

  const icon = useSelector(selectActiveNetworkIcon())
  const L1Icon = L1_ICONS[icon]
  const L2Icon = L2_ICONS[icon]

  const networkChangeHandler = () => {
    console.log(`${fromNetwork['value']} to ${toNetwork['value']}`)
    if (!(fromNetwork.value + toNetwork.value).includes('All')) {
      dispatch(
        setActiveHistoryTab(`${fromNetwork.value} to ${toNetwork.value}`)
      )
    } else {
      dispatch(setActiveHistoryTab('All'))
    }
  }

  useEffect(() => {
    networkChangeHandler()
  }, [fromNetwork, toNetwork])

  const transactions = useSelector(selectTransactions, isEqual)

  const getNetworks = () => {
    return [
      DEFAULT_NETWORK,
      {
        label: networkName['l1'],
        value: networkName['l1'],
        imgSrc: L1Icon({ selected: true }),
      },
      {
        label: networkName['l2'],
        value: networkName['l2'],
        imgSrc: L2Icon({ selected: true }),
      },
    ]
  }

  const getDatePicker = (label) => {
    const dateSelector = (date) => {
      label === 'To' ? setEndDate(date) : setStartDate(date)
      console.log('end date:', endDate)
      console.log('start date:', startDate)
    }
    return (
      <>
        <DatePicker
          wrapperClassName={
            theme.palette.mode === 'light'
              ? styles.datePickerInput
              : styles.datePickerInputDark
          }
          popperClassName={styles.popperStyle}
          selected={label === 'To' ? endDate : startDate}
          onChange={(date) => dateSelector(date)}
          {...(label === 'From'
            ? { selectsStart: true }
            : { selectsEnd: true })}
          calendarClassName={theme.palette.mode}
          placeholderText={isMobile ? { label } : ''}
          {...(label === 'From'
            ? { endDate: new Date(endDate) }
            : { startDate: new Date(startDate), minDate: new Date(startDate) })}
          maxDate={new Date(now)}
        />
      </>
    )
  }
  const syncTransactions = async () => {
    if (accountEnabled) {
      const newTransactions = await transctionService.getTransactions()
      console.log('poller called')
      if (new Set(transactions).size !== new Set(newTransactions).size) {
        console.log('actualizando')
        dispatch(fetchTransactions())
      }
    }
  }
  useInterval(async () => {
    await syncTransactions()
  }, POLL_INTERVAL)

  return (
    <S.HistoryPageContainer>
      {layer && (
        <>
          <S.Header>
            <div className={styles.searchInput}>
              <Input
                size="small"
                placeholder="Search Here"
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
                  Date range from
                </div>
              ) : null}
              {getDatePicker('From')}
              {!isMobile ? (
                <div style={{ margin: '0px 10px', opacity: 0.7 }}>to </div>
              ) : null}

              {getDatePicker('To')}
            </div>
          </S.Header>

          <Table>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <S.TableFilters
                style={{
                  width: '100%',
                }}
              >
                <S.NetworkDropDowns>
                  <div style={{ fontSize: '16px' }}>From</div>
                  <DropdownNetwork
                    items={getNetworks()}
                    defaultItem={fromNetwork}
                    onItemSelected={(option) => {
                      setFromNetwork(option)
                    }}
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
                  />
                </S.NetworkDropDowns>
                <FilterDropDown
                  items={FILTER_OPTIONS}
                  defaultItem={FILTER_OPTIONS[0]}
                  imgSrc={FilterIcon}
                  onItemSelected={(item) => {
                    setTransactionStatus(item.value)
                  }}
                />
              </S.TableFilters>
              <TransactionsTableHeader
                options={TableOptions}
              ></TransactionsTableHeader>
            </div>
            <TransactionsResolver
              transactions={transactions}
              transactionsFilter={{
                networks: networkName,
                fromNetwork: fromNetwork.value,
                toNetwork: toNetwork.value,
                status: transactionStatus,
                targetHash: searchHistory,
                startDate: startDate,
                endDate: endDate,
              }}
              style={{ maxHeight: '70%' }}
            ></TransactionsResolver>
          </Table>

          <div
            style={{ marginLeft: 'auto', marginRight: 'auto', padding: '20px' }}
          >
            <Button
              style={{ marginLeft: 'auto', marginRight: 'auto' }}
              type="primary"
              variant="contained"
              size="small"
              newStyle
              onClick={() => dispatch(setConnect(true))}
              sx={{ fontWeight: '500;' }}
            >
              Connect Wallet
            </Button>
          </div>
        </>
      )}
    </S.HistoryPageContainer>
  )
}

export default React.memo(History)
