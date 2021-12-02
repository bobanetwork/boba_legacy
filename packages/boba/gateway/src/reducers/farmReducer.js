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

import networkService from 'services/networkService'

const allAddresses = networkService.getAllAddresses()

const initialState = {
  // totalL1FeeRate: 0,
  // totalL2FeeRate: 0,
  // userL1RewardFeeRate: 0,
  // userL2RewardFeeRate: 0,
  poolInfo: {
    L1LP: {
      [allAddresses.L1_ETH_Address]: {},
    },
    L2LP: {
      [allAddresses.L2_ETH_Address]: {},
    }
  },
  userInfo: {
    L1LP: {
      [allAddresses.L1_ETH_Address]: {},
    },
    L2LP: {
      [allAddresses.L2_ETH_Address]: {},
    }
  },
  stakeToken: {
    symbol: "ETH",
    currency: allAddresses.L1_ETH_Address,
    LPAddress: allAddresses.L1LPAddress,
    L1orL2Pool: 'L1LP'
  },
  withdrawToken: {
    symbol: "ETH",
    currency: allAddresses.L1_ETH_Address,
    LPAddress: allAddresses.L1LPAddress,
    L1orL2Pool: 'L1LP'
  },
  approvedAllowance: '',
  lpBalanceWeiString: '',
  allAddresses: {},
};

function farmReducer (state = initialState, action) {
  switch (action.type) {
    case 'GET_FARMINFO':
      return state;
    case 'GET_FARMINFO_SUCCESS':
      return {
        ...state,
        poolInfo: {
          L1LP: action.payload.L1PoolInfo,
          L2LP: action.payload.L2PoolInfo,
        },
        userInfo: {
          L1LP: action.payload.L1UserInfo,
          L2LP: action.payload.L2UserInfo,
        }
      }
    // case 'GET_L1FEE':
    //   return state;
    // case 'GET_L2FEE':
    //   return state;
    // case 'GET_L1FEE_SUCCESS':
    //   return { 
    //     ...state, 
    //     userL1RewardFeeRate: action.payload.userRewardFeeRate,
    //     totalL1FeeRate: action.payload.totalFeeRate,
    //   }
    // case 'GET_L2FEE_SUCCESS':
    //   return { 
    //     ...state, 
    //     userL2RewardFeeRate: action.payload.userRewardFeeRate,
    //     totalL2FeeRate: action.payload.totalFeeRate,
    //   }
    case 'UPDATE_STAKE_TOKEN':
      return {
        ...state,
        stakeToken: action.payload,
      }
    case 'UPDATE_WITHDRAW_TOKEN':
      return {
        ...state,
        withdrawToken: action.payload,
      }
    case 'FETCH/ALLOWANCE/SUCCESS':
      return {
        ...state,
        approvedAllowance: action.payload.toString(),
      }
    case 'FETCH/ALLOWANCE/RESET':
      return {
        ...state,
        approvedAllowance: action.payload,
      }
    case 'FETCH/ALLOWANCE/ERROR':
      return {
        ...state,
        approvedAllowance: '',
      }
    case 'FETCH/L1LPBALANCE/SUCCESS':
    case 'FETCH/L2LPBALANCE/SUCCESS':
      return {
        ...state,
        lpBalanceWeiString: action.payload,
      }
    case 'GET/ALL/ADDRESS/SUCCESS':
      return {
        ...state,
        allAddresses: action.payload,
      }
    case 'GET/ALL/ADDRESS/ERROR':
      return {
        ...state,
        allAddresses: {},
      }
    case 'FETCH/L1LPBALANCE/ERROR':
    case 'FETCH/L2LPBALANCE/ERROR':
      return {
        ...state,
        lpBalanceWeiString: '',
      }
    default:
      return state;
  }
}

export default farmReducer;
