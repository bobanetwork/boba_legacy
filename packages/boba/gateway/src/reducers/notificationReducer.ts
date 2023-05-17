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
  notificationText: string | null
  notificationButtonText: string | null
  notificationButtonAction: string | null
  notificationStatus: string
}

type ActionTypes = 'OPEN_NOTIFICATION' | 'CLOSE_NOTIFICATION'

type Action = {
  type: ActionTypes
  payload: {
    notificationText?: string
    notificationButtonText?: string
    notificationButtonAction?: string
  }
}

const initialState: State = {
  notificationText: null,
  notificationButtonText: null,
  notificationButtonAction: null,
  notificationStatus: 'close',
}

const actionHandlers: Record<
  ActionTypes,
  (state: State, action: Action) => State
> = {
  OPEN_NOTIFICATION: (state: State, action: Action): State => ({
    notificationStatus: 'open',
    notificationText: action.payload.notificationText || null,
    notificationButtonText: action.payload.notificationButtonText || null,
    notificationButtonAction: action.payload.notificationButtonAction || null,
  }),

  CLOSE_NOTIFICATION: (state: State, action: Action): State => ({
    notificationStatus: 'close',
    notificationText: null,
    notificationButtonText: null,
    notificationButtonAction: null,
  }),
}

const notificationReducer = (
  state: State = initialState,
  action: Action
): State => {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}

export default notificationReducer
