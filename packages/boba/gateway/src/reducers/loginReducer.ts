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
  invitationCodeVerifyError: null | string
}

type Action = {
  type: string
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
  PROVIDE_PASSWORD: (state: State, action: Action) => ({
    ...state,
    AESKey: action.payload.AESKey,
    FHEseed: action.payload.FHEseed,
  }),
  LOGIN: (state: State) => ({
    ...state,
    loggedIn: true,
  }),
  UPDATE_USER_TYPE: (state: State, action: Action) => ({
    ...state,
    isBeginner: action.payload,
  }),
  VERIFY_INVITATION_CODE: (state: State) => ({
    ...state,
    invitationCodeGood: false,
    invitationCodeVerifyLoad: true,
    invitationCodeVerifyError: null,
  }),
  VERIFY_INVITATION_CODE_SUCCESS: (state: State) => ({
    ...state,
    invitationCodeGood: true,
    invitationCodeVerifyLoad: false,
    invitationCodeVerifyError: false,
  }),
  VERIFY_INVITATION_CODE_FAILURE: (state: State, action: Action) => ({
    ...state,
    invitationCodeGood: false,
    invitationCodeVerifyLoad: false,
    invitationCodeVerifyError: action.payload,
  }),
}

const loginReducer = (state: State = initialState, action: Action): State => {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}

export default loginReducer
