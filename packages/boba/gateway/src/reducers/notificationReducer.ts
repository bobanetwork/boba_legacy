/*
  OmgX - A Privacy-Preserving Marketplace
  OmgX uses Fully Homomorphic Encryption to make markets fair. 
  Copyright (C) 2021 Enya Inc. Palo Alto, CA

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

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
