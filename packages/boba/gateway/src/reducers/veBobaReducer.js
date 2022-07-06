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

const initialState = {
  records: [],
  votingPower: 0,
  bobaRatio: 0,
}

function veBobaReducer(state = initialState, action) {
  switch (action.type) {
    case 'LOCK/RECORDS/GET/SUCCESS':
      console.log(JSON.stringify(action.payload.records[0]))
      return { ...state, ...action.payload }

    case 'LOCK/VOTINGPOWER/GET/SUCCESS':
      return { ...state, ...action.payload }

    case 'LOCK/RATIO/GET/SUCCESS':
      return { ...state, ...action.payload }

    default:
      return state
  }
}

export default veBobaReducer
