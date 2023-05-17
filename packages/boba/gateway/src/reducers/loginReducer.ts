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
