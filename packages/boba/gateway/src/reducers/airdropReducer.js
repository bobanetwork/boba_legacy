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

const initialState = {
  claimDetailsL1: {},
  claimDetailsL2: {}
}

function airdropReducer(state = initialState, action) {
  switch (action.type) {
    case 'FETCH/AIRDROPL1/STATUS/SUCCESS':
      return {
        ...state,
        claimDetailsL1: action.payload
      }
    case 'FETCH/AIRDROPL2/STATUS/SUCCESS':
      return {
        ...state,
        claimDetailsL2: action.payload
      }
    default:
      return state
  }
}

export default airdropReducer
