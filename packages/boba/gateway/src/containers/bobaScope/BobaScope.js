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
import { useDispatch } from 'react-redux'
import { isEqual, orderBy } from 'util/lodash';


import { useSelector } from 'react-redux'

import "react-datepicker/dist/react-datepicker.css"

import { setActiveDataTab } from 'actions/uiAction'
import { fetchSevens, fetchFastExits } from 'actions/networkAction'

import { selectBaseEnabled, selectActiveDataTab, selectSevens, selectFastExits } from 'selectors'

import Tabs from 'components/tabs/Tabs'
import Input from 'components/input/Input'

import Sevens from './Sevens'
import FastExits from './FastExits'

import useInterval from 'hooks/useInterval'

import { POLL_INTERVAL } from 'util/constant'
import { ContentContainer, Header, ScopePageContainer } from './History.styles';

function BobaScope() {

  const dispatch = useDispatch()

  const [ searchData, setSearchData ] = useState('')

  const activeTab = useSelector(selectActiveDataTab, isEqual)
  const baseEnabled = useSelector(selectBaseEnabled())

  const unorderedSevens = useSelector(selectSevens, isEqual)
  const orderedSevens = orderBy(unorderedSevens, i => i.timeStamp, 'desc')
  const sevens = orderedSevens

  const unorderedFastExits = useSelector(selectFastExits, isEqual)
  const orderedFastExits = orderBy(unorderedFastExits, i => i.timeStamp, 'desc')
  const fastExits = orderedFastExits

  useEffect(() => {
    if (baseEnabled) {
      dispatch(fetchSevens())
      dispatch(fetchFastExits())
    }
  }, [ dispatch, baseEnabled ])

  useInterval(() => {
    if (baseEnabled) {
      dispatch(fetchSevens())
      dispatch(fetchFastExits())
    }
  }, POLL_INTERVAL)

  return (
    <ScopePageContainer>
      <Header>
        <SearchInputContainer>
          <Input
            size='small'
            placeholder='Search by hash'
            value={searchData}
            onChange={i => { setSearchData(i.target.value) }}
            style={{
              flex: 1,
              marginBottom: 0,
              minWidth: '250px',
            }}
          />
        </SearchInputContainer>
      </Header>
      <ContentContainer>
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
      </ContentContainer>
    </ScopePageContainer>
  );
}

export default React.memo(BobaScope)
