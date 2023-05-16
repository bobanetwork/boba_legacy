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
  CDMType: string
  CDMMessage: string
  CDMTransaction: string
}

type ActionTypes =
  | 'TRANSACTION/GETALL/SUCCESS'
  | 'TRANSFER/CREATE/SUCCESS'
  | 'SETTLE_v0/CREATE/SUCCESS'
  | 'SETTLE_v1/CREATE/SUCCESS'
  | 'SETTLE_v2/CREATE/SUCCESS'
  | 'SETTLE_v2OLO/CREATE/SUCCESS'
  | 'SETTLE_v3/CREATE/SUCCESS'
  | 'SETTLE_v3OLO/CREATE/SUCCESS'
  | 'MONSTER/CREATE/SUCCESS'
  | 'CDM/COMPLETE/SET'
  | 'CDM/COMPLETE/RESET'

type Action = {
  type: ActionTypes
  payload?: Partial<State>
}

const initialState: State = {
  CDMType: '',
  CDMMessage: '',
  CDMTransaction: '',
}

const actionHandlers: Record<string, (state: State, action: Action) => State> =
  {
    'TRANSACTION/GETALL/SUCCESS': (state, action) => ({
      ...state,
      ...action.payload,
    }),
    'CDM/COMPLETE/SET': (state, action) => ({
      ...state,
      ...action.payload,
    }),
    'CDM/COMPLETE/RESET': () => ({
      ...initialState,
    }),
  }

const transactionReducer = (
  state: State = initialState,
  action: Action
): State => {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}

export default transactionReducer
