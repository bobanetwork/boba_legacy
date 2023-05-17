/*
  Varna - A Privacy-Preserving Marketplace
  Varna uses Fully Homomorphic Encryption to make markets fair. 
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
  FHEseed: null | string
  AESKey: null | string
  loggedIn: boolean
  isBeginner: boolean
  invitationCodeGood: boolean
  invitationCodeVerifyLoad: boolean
  invitationCodeVerifyError: null | boolean
}

enum ActionType {
  PROVIDE_PASSWORD = 'PROVIDE_PASSWORD',
  LOGIN = 'LOGIN',
  UPDATE_USER_TYPE = 'UPDATE_USER_TYPE',
  VERIFY_INVITATION_CODE = 'VERIFY_INVITATION_CODE',
  VERIFY_INVITATION_CODE_SUCCESS = 'VERIFY_INVITATION_CODE_SUCCESS',
  VERIFY_INVITATION_CODE_FAILURE = 'VERIFY_INVITATION_CODE_FAILURE',
}

type Action = {
  type: ActionType
  payload: any
}

const initialState: State = {
  FHEseed: null,
  AESKey: null,
  loggedIn: false,
  isBeginner: true,
  invitationCodeGood: false,
  invitationCodeVerifyLoad: false,
  invitationCodeVerifyError: null,
}

const actionHandlers = {
  [ActionType.PROVIDE_PASSWORD]: (state: State, action: Action) => ({
    ...state,
    AESKey: action.payload.AESKey,
    FHEseed: action.payload.FHEseed,
  }),
  [ActionType.LOGIN]: (state: State) => ({
    ...state,
    loggedIn: true,
  }),
  [ActionType.UPDATE_USER_TYPE]: (state: State, action: Action) => ({
    ...state,
    isBeginner: action.payload,
  }),
  [ActionType.VERIFY_INVITATION_CODE]: (state: State) => ({
    ...state,
    invitationCodeGood: false,
    invitationCodeVerifyLoad: true,
    invitationCodeVerifyError: null,
  }),
  [ActionType.VERIFY_INVITATION_CODE_SUCCESS]: (state: State) => ({
    ...state,
    invitationCodeGood: true,
    invitationCodeVerifyLoad: false,
    invitationCodeVerifyError: null,
  }),
  [ActionType.VERIFY_INVITATION_CODE_FAILURE]: (
    state: State,
    action: Action
  ) => ({
    ...state,
    invitationCodeGood: false,
    invitationCodeVerifyLoad: false,
    invitationCodeVerifyError: action.payload,
  }),
} as Record<ActionType, (state: State, action: Action) => State>

const loginReducer = (state: State = initialState, action: Action): State => {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}

export default loginReducer
