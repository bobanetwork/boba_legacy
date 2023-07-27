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
  tokens: [],
  bridgeType: 'CLASSIC',
  multiBridgeMode: false,
  bridgeToAddressState: false,
  amountToBridge: 0,
  isFetchTxBlockNumber: false,
  alerts: []
};

function bridgeReducer(state = initialState, action) {
  switch (action.type) {
    case 'BRIDGE/TYPE/SELECT':
      return {
        ...state,
        bridgeType: action.payload
      }

    case 'BRIDGE/TOKEN/RESET':
      return {
        ...state,
        tokens: [],
        multiBridgeMode: false
      }

    case 'BRIDGE/TOKEN/SELECT':
      return {
        ...state,
        tokens: [
          ...state.tokens,
          {
            ...action.payload,
            amount: 0,
            toWei_String: 0,
          }
        ],
      }

    case 'BRIDGE/TOKEN/UPDATE': {
      let newTokens = [ ...state.tokens ];
      const { token, tokenIndex } = action.payload;
      newTokens[ tokenIndex ] = {
        ...token,
        amount: 0,
        toWei_String: 0,
      };

      return { ...state, tokens: newTokens }
    }

    case 'BRIDGE/TOKEN/REMOVE': {
      let tokens = [ ...state.tokens ];
      tokens.splice(action.payload, 1)

      return { ...state, tokens: tokens }
    }

    case 'BRIDGE/MODE/CHANGE':
      return { ...state, multiBridgeMode: action.payload }

    case 'BRIDGE/TOADDRESS/SET':
      return {
        ...state,
        bridgeToAddressState: action.payload
      }

    case 'BRIDGE/TOKEN/AMOUNT/CHANGE': {
      let newTokens = [ ...state.tokens ];
      let { index, amount, toWei_String } = action.payload;
      newTokens[ index ] = {
        ...newTokens[ index ],
        amount,
        toWei_String
      };
      return { ...state, tokens: newTokens }
    }

    case 'BRIDGE/ALERT/SET': {
      const isFound = state.alerts.find((alert) => alert.meta === action.payload.meta)
      if (state.alerts.length && isFound) {
        return {...state}
      }

      return {
        ...state,
        alerts: [
          ...state.alerts,
          action.payload
        ]
      }
    }

    case 'BRIDGE/ALERT/CLEAR': {
      const filterAlerts = state.alerts.filter((alert) =>
        !action.payload.keys.includes(alert.meta))
      return { ...state, alerts: filterAlerts }
    }

    case 'BRIDGE/ALERT/PURGE': {
      return { ...state, alerts: [] }
    }

    case 'BRIDGE/AMOUNT/SET': {
      return { ...state, amountToBridge: action.payload }
    }
    case 'BRIDGE/AMOUNT/RESET': {
      return { ...state, amountToBridge: 0 }
    }

    case 'BRIDGE/DEPOSIT_TX/BLOCK': {
      return { ...state, isFetchTxBlockNumber: action.payload }
    }

    default:
      return state;
  }
}

export default bridgeReducer
