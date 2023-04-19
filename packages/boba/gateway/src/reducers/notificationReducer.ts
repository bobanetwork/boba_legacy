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

type initialStateType = {
  notificationText: string
  notificationButtonText: string
  notificationButtonAction: string
  notificationStatus: string
}
const initialState: initialStateType = {
  notificationText: '',
  notificationButtonText: '',
  notificationButtonAction: '',
  notificationStatus: 'close',
}

type ReducerActionType = {
  [key: string]: (state: initialStateType, action: any) => initialStateType
}

const reducerActions: ReducerActionType = {
  OPEN_NOTIFICATION: (state, action) => ({
    notificationStatus: 'open',
    notificationText: action.payload.notificationText,
    notificationButtonText: action.payload.notificationButtonText,
    notificationButtonAction: action.payload.notificationButtonAction,
  }),
  CLOSE_NOTIFICATION: (state, action) => ({
    notificationStatus: 'close',
    notificationText: '',
    notificationButtonText: '',
    notificationButtonAction: '',
  }),
}

const notificationReducer = (state = initialState, action: any) => {
  const reducer = reducerActions[action.type]
  if (reducer) {
    return reducer(state, action)
  }
  return state
}

export default notificationReducer
