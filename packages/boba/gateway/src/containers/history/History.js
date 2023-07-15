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
import { isSameOrAfterDate, isSameOrBeforeDate } from 'util/dates'
import Input from 'components/input/Input'
import Button from 'components/button/Button.js'
import { DropdownNetwork } from 'components/global/dropdown/themes'

import { setActiveHistoryTab } from 'actions/uiAction'
import {
  selectActiveHistoryTab,
  selectTransactions,
  selectAccountEnabled,
  selectLayer,
} from 'selectors'

import { fetchTransactions } from 'actions/networkAction'
import { formatDate } from 'util/dates'

import Exits from './TX_Exits'
import Deposits from './TX_Deposits'
import All from './TX_All'
import Pending from './TX_Pending'
import Transfers from './TX_Transfers'

import * as S from './History.styles'
import styles from './TX_All.module.scss'
import { Table } from './styles'

import useInterval from 'hooks/useInterval'
import Connect from 'containers/connect/Connect'
import Tabs from 'components/tabs/Tabs'
import Select from 'components/select/Select'
import { setConnectBOBA, setConnect } from 'actions/setupAction'

import { POLL_INTERVAL } from 'util/constant'
import { selectActiveNetworkName } from 'selectors'
// import { IDropdownItem } from 'components/global/dropdown/types'
import AvalancheIcon from '../../images/avax.svg'
import BNBIcon from '../../images/bnb.svg'
import EthereumIcon from '../../images/ethereumFlex.svg'
import FantomIcon from '../../images/ftm.svg'
import AllNetworksIcon from '../../images/allNetworks.svg'
import { TableHeader } from 'components/global/table/index.tsx'
import { element } from 'prop-types'
import { TransactionsResolver } from './TransactionsResolver'
import { TransactionsTableHeader } from 'components/global/table/themes'

const NETWORKS = [
  {
    value: 'All',
    label: 'All Networks',
    imgSrc: AllNetworksIcon,
  },
  {
    value: 'Avalanche',
    label: 'Avalanche',
    imgSrc: AvalancheIcon,
  },
  { value: 'BNB', label: 'BNB', imgSrc: BNBIcon },
  {
    value: 'Ethereum',
    label: 'Ethereum',
    imgSrc: EthereumIcon,
  },
  { value: 'Fantom', label: 'Fantom', imgSrc: FantomIcon },
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
  const [toNetwork, setToNetwork] = useState(NETWORKS[0])
  const [fromNetwork, setFromNetwork] = useState(NETWORKS[0])

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
  console.log(networkName)

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
        isSameOrBeforeDate(i.timeStamp, endDate)
      )
    }
    return true
  })

  const getNetworks = () => {
    return [
      NETWORKS[0],
      {
        label: networkName['l1'],
        value: networkName['l1'],
        imgSrc: EthereumIcon,
      },
      {
        label: networkName['l2'],
        value: networkName['l2'],
        imgSrc: EthereumIcon,
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

  useInterval(() => {
    if (accountEnabled) {
      dispatch(fetchTransactions())
    }
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
                <div>Filter</div>{' '}
                {/* {need to make this a dropdown and add the image} */}
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
                status: 'All',
                targetHash: searchHistory,
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
