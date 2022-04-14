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

import "react-datepicker/dist/react-datepicker.css"

import { setActiveDataTab } from 'actions/uiAction'
import { fetchSevens, fetchFastExits } from 'actions/networkAction'

import { selectActiveDataTab } from 'selectors/uiSelector'
import { selectSevens, selectFastExits } from 'selectors/dataSelector'

import Tabs from 'components/tabs/Tabs'
import Input from 'components/input/Input'

import Sevens from './Sevens'
import FastExits from './FastExits'

import * as styles from './Transactions.module.scss'
import * as S from './History.styles'

import useInterval from 'util/useInterval'

import { POLL_INTERVAL } from 'util/constant'
import PageTitle from 'components/pageTitle/PageTitle'
import AlertIcon from 'components/icons/AlertIcon'
import WalletPicker from 'components/walletpicker/WalletPicker'
import { selectAccountEnabled } from 'selectors/setupSelector'

function BobaScope() {

  const dispatch = useDispatch()

  const [ searchData, setSearchData ] = useState('')

  const activeTab = useSelector(selectActiveDataTab, isEqual)
  const accountEnabled = useSelector(selectAccountEnabled())

  const unorderedSevens = useSelector(selectSevens, isEqual)
  const orderedSevens = orderBy(unorderedSevens, i => i.timeStamp, 'desc')
  const sevens = orderedSevens

  const unorderedFastExits = useSelector(selectFastExits, isEqual)
  const orderedFastExits = orderBy(unorderedFastExits, i => i.timeStamp, 'desc')
  const fastExits = orderedFastExits

  useInterval(() => {
    if (accountEnabled) {
      batch(() => {
        dispatch(fetchSevens())
        dispatch(fetchFastExits())
      })
    }
  }, POLL_INTERVAL)

  if (!accountEnabled) {

    return <S.ScopePageContainer>
      <PageTitle title="Boba Scope" />
      <S.LayerAlert>
        <S.AlertInfo>
          <AlertIcon />
          <S.AlertText
            variant="body2"
            component="p"
          >
            Connect to MetaMask to access Boba Scope
          </S.AlertText>
        </S.AlertInfo>
        <WalletPicker />
      </S.LayerAlert>
    </S.ScopePageContainer>
  }


  return (
    <S.ScopePageContainer>
      <PageTitle title="Boba Scope" />

      <S.Header>
        <div className={styles.searchInput}>
          <Input
            size='small'
            placeholder='Search by hash'
            value={searchData}
            onChange={i => { setSearchData(i.target.value) }}
            className={styles.searchBar}
          />
        </div>
      </S.Header>
      <div className={styles.data}>
        <div className={styles.section}>
          <Tabs
            onClick={tab => { dispatch(setActiveDataTab(tab)) }}
            activeTab={activeTab}
            tabs={[ 'Seven Day Queue', 'Fast Exits' ]}
          />

          {activeTab === 'Seven Day Queue' && (
            <Sevens
              searchData={searchData}
              sevens={sevens}
            />
          )}
          {activeTab === 'Fast Exits' && (
            <FastExits
              searchData={searchData}
              data={fastExits}
            />
          )}
        </div>
      </div>
    </S.ScopePageContainer>
  );
}

export default React.memo(BobaScope)
