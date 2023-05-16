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
  stakeCount: number
  stakeInfo: Record<string, unknown>
}

type Action = {
  type: string
  payload: Partial<State>
}

const initialState: State = {
  stakeCount: 0,
  stakeInfo: {},
}

const actionHandlers: Record<string, (state: State, action: Action) => State> =
  {
    'GET/FS_SAVES/SUCCESS': (state, action) => ({
      ...state,
      ...action.payload,
    }),
    'GET/FS_INFO/SUCCESS': (state, action) => ({ ...state, ...action.payload }),
  }

const fixedReducer = (state: State = initialState, action: Action): State => {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}

export default fixedReducer
