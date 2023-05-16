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

type State = {
  [key: string]: {
    currency: string
    addressL1: string
    addressL2: string
    symbolL1: string
    symbolL2: string
    decimals: number
    name: string
    redalert: boolean
  }
}

type ActionTypes = 'TOKEN/GET/RESET' | 'TOKEN/GET/SUCCESS' | 'TOKEN/GET/FAILURE'

type Action = {
  type: ActionTypes
  payload: {
    currency: string
    addressL1: string
    addressL2: string
    symbolL1: string
    symbolL2: string
    decimals: number
    name: string
    redalert: boolean
  }
}

const L1ETH = '0x0000000000000000000000000000000000000000'
const L2ETH = '0x4200000000000000000000000000000000000006'

const initialState: State = {
  [L1ETH]: {
    currency: L1ETH,
    addressL1: L1ETH,
    addressL2: L2ETH,
    symbolL1: 'ETH',
    symbolL2: 'ETH',
    decimals: 18,
    name: 'Ethereum',
    redalert: false,
  },
}

const actionHandlers: Record<string, (state: State, action: Action) => State> =
  {
    'TOKEN/GET/RESET': () => ({ ...initialState }),
    'TOKEN/GET/SUCCESS': (state, action) => ({
      ...state,
      [action.payload.currency]: action.payload,
    }),
    'TOKEN/GET/FAILURE': (state, action) => ({
      ...state,
      [action.payload.currency]: action.payload,
    }),
  }

const tokenReducer = (state: State = initialState, action: Action): State => {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}

export default tokenReducer
