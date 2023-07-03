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
import * as G from '../Global.styles'
import { useDispatch } from 'react-redux'
import { isEqual,orderBy } from 'util/lodash';

import { useSelector } from 'react-redux'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { useMediaQuery, useTheme } from '@mui/material'
import {isSameOrAfterDate, isSameOrBeforeDate} from 'util/dates'
import Input from 'components/input/Input'
import Button from 'components/button/Button.js'

import { setActiveHistoryTab } from 'actions/uiAction'
import {
  selectActiveHistoryTab,
  selectTransactions,
  selectAccountEnabled,
  selectLayer
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
import Select from 'components/select/Select'
import { setConnectBOBA, setConnect } from 'actions/setupAction'

import { POLL_INTERVAL } from 'util/constant'
import { selectActiveNetworkName } from 'selectors'
import { Dropdown } from "components/global/dropdown/index/network"
import AvalancheIcon from '../../images/avax.svg'
import BNBIcon from "../../images/bnb.svg"
import EthereumIcon from "../../images/ethereum.svg"
import FantomIcon from "../../images/ftm.svg"
import AllNetworksIcon from "../../images/allNetworks.svg"


const NETWORKS = [
  {value:"All Networks", label: "All Networks", key:"All Networks", imgSrc:AllNetworksIcon},
  { value: "Avalanche", label: "Avalanche", key: "Avalanche", imgSrc: AvalancheIcon},
  {value:"BNB", label:"BNB",key:"BNB", imgSrc: BNBIcon},
  { value: "Ethereum", label: "Ethereum", key: "Ethereum", imgSrc:EthereumIcon},
  { value: "Fantom", label: "Fantom", key: "Fantom", imgSrc: FantomIcon }
  // {value:"All Networks", label: "All Networks", key:"All Networks", imgSrc:AllNetworksIcon},
  // { value: "Avalanche", label: "Avalanche", key: "Avalanche", imgSrc: AvalancheIcon},
  // {value:"BNB", label:"BNB",key:"BNB", imgSrc: BNBIcon},
  // { value: "Ethereum", label: "Ethereum", key: "Ethereum", imgSrc:EthereumIcon},
  // { value: "Fantom", label: "Fantom", key: "Fantom", imgSrc:FantomIcon}
]
  
const TABLE_HEADINGS = ["Date", "From", "To", "Token", "Amount", "Status"]


function History() {

  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0])
  const getTableHeadings = () => {
    return (
      <>
      {
        TABLE_HEADINGS.map((element) => {
        return (
          <div>{element}</div>
        )
        })}
    </>
    )
  }

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

  const getDatePicker = (label) => { 
    return (<>
      <DatePicker
        wrapperClassName={theme.palette.mode === "light" ? styles.datePickerInput : styles.datePickerInputDark}
        popperClassName={styles.popperStyle}
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        selectsStart
        endDate={new Date(endDate)}
        maxDate={new Date(endDate)}
        calendarClassName={theme.palette.mode}
        placeholderText={isMobile ? {label} : ''}
      />
      </>)
  
    
  }

  useInterval(() => {
     if (accountEnabled) {
      dispatch(fetchTransactions())
    }
  }, POLL_INTERVAL)

  return (
    <S.HistoryPageContainer>

      {true && (
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
                  Date range from
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
          
          <S.Table>
            <S.TableFilters>
              <S.NetworkDropDowns>
                <div style={{fontSize:'16px'}}>From</div>
                <Dropdown {...{ items: NETWORKS, defaultItem: selectedNetwork }}/>
                <div style={{fontSize:'16px',paddingLeft:'16px'}}>To</div>
                <Dropdown {...{ items: NETWORKS, defaultItem: selectedNetwork }} />
              </S.NetworkDropDowns>
              <div>Filter</div>
            </S.TableFilters>
            <S.TableHeadings>
              {getTableHeadings()}
            </S.TableHeadings>
          </S.Table>

          <div style={{marginLeft: "auto", marginRight: "auto", padding:"20px"}}>
            <Button style={{marginLeft: "auto",
                    marginRight: "auto"}}
                    type="primary"
                    variant="contained"
                    size="small"
                    newStyle
                    onClick={() => dispatch(setConnect(true))}
                    sx={{fontWeight: '500;'}}>
              Connect Wallet
            </Button>
          </div>
        </>
      )}
    </S.HistoryPageContainer>
  )
}

export default React.memo(History)
