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
  exitLPsigned: false,
  exitTRADsigned: false,
  depositLPsigned: false
}

function signatureReducer (state = initialState, action) {
  switch (action.type) {
    case 'EXIT/LP/SIGNED':
      return {
        ...state,
        exitLPsigned: action.payload
      }
      case 'EXIT/TRAD/SIGNED':
      return {
        ...state,
        exitTRADsigned: action.payload
      }
      case 'DEPOSIT/LP/SIGNED':
      return {
        ...state,
        depositLPsigned: action.payload
      }
    default:
      return state;
  }
}

export default signatureReducer;
