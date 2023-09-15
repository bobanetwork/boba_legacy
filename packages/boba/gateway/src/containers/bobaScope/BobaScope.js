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

import { fetchSevens, fetchFastExits } from 'actions/networkAction'

import { selectBaseEnabled, selectSevens, selectFastExits } from 'selectors'

import Sevens from './Sevens'
import FastExits from './FastExits'

import useInterval from 'hooks/useInterval'

import { POLL_INTERVAL } from 'util/constant'
import {Header, BobaScopeContainer, ContentContainer} from './styles'
import { TabComponent } from 'components/global/tabs';
import { SearchInput } from 'components/global/searchInput';

function BobaScope() {

  const dispatch = useDispatch()

  const [ searchData, setSearchData ] = useState('')

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
    <BobaScopeContainer>
      <Header>
        <SearchInput
        placeholder='Search by hash'
        value={searchData}
        onChange={i => { setSearchData(i.target.value) }}/>
      </Header>
      <ContentContainer>
      <TabComponent
          tabs={[
            {label:"Seven Day Queue",
              content:(<Sevens
                searchData={searchData}
                sevens={sevens}
              />)
            },
            {label:"Fast Exits",
              content:(          <FastExits
                searchData={searchData}
                data={fastExits}
              />)
            }
        ]}
        />
      </ContentContainer>
    </BobaScopeContainer>
  );
}

export default React.memo(BobaScope)
