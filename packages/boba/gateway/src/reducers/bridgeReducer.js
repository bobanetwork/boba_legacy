/*
Copyright 2019-present OmiseGO Pte Ltd

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
  tokenAmounts: {},
  bridgeType: null
};

function bridgeReducer(state = initialState, action) {
  switch (action.type) {
    case 'BRIDGE/TYPE/SELECT':
      return { ...state, bridgeType: action.payload }

    case 'BRIDGE/TOKEN/SELECT':
      {
        let amount = state.tokenAmounts;
        if (!amount.hasOwnProperty(action.payload.symbol)) {
          amount = { ...amount, [ action.payload.symbol ]: 0 }
        }

        return {
          ...state,
          tokens: [ ...state.tokens, action.payload ],
          tokenAmounts: amount
        }
      }
    case 'BRIDGE/TOKEN/UPDATE': {
      let newTokens = [ ...state.tokens ];
      let amount = state.tokenAmounts;
      const { token, tokenIndex } = action.payload;
      
      newTokens[ tokenIndex ] = token;
      
      if (!amount.hasOwnProperty(token.symbol)) {
        amount = { ...amount, [ token.symbol ]: 0 }
      }

      return { ...state, tokens: newTokens, tokenAmounts: amount }
    }

    case 'BRIDGE/TOKEN/REMOVE':
      let tokens = [ ...state.tokens ];
      tokens.splice(action.payload, 1)
      return { ...state, tokens: tokens }

    case 'BRIDGE/TOKEN/AMOUNT/CHANGE':
      let tokenAmounts = { ...state.tokenAmounts };
      let { symbol, amount } = action.payload;
      tokenAmounts[ symbol ] = amount;
      return { ...state, tokenAmounts: tokenAmounts }

    default:
      return state;
  }
}

export default bridgeReducer
