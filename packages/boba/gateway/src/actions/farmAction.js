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

import networkService from 'services/networkService'
import { createAction } from './createAction'

const getFarmInfoBegin = () => ({
  type: 'GET_FARMINFO',
})

const getFarmInfoSuccess = (L1PoolInfo, L1UserInfo, L2PoolInfo, L2UserInfo) => ({
  type: 'GET_FARMINFO_SUCCESS',
  payload: { L1PoolInfo, L1UserInfo, L2PoolInfo, L2UserInfo }
})

// const getL1FeeBegin = () => ({
//   type: 'GET_USERINFO',
// })

// const getL2FeeBegin = () => ({
//   type: 'GET_USERINFO',
// })

// const getL1FeeSuccess = (totalFeeRate, userRewardFeeRate) => ({
//   type: 'GET_L1FEE_SUCCESS',
//   payload: { totalFeeRate, userRewardFeeRate },
// })

// const getL2FeeSuccess = (totalFeeRate, userRewardFeeRate) => ({
//   type: 'GET_L2FEE_SUCCESS',
//   payload: { totalFeeRate, userRewardFeeRate },
// })

export const getFarmInfo = () => async (dispatch) => {
  console.log("getFarmInfo()")
  dispatch(getFarmInfoBegin())
   const [L1LPInfo, L2LPInfo] = await Promise.all([
    networkService.getL1LPInfo(),
    networkService.getL2LPInfo(),
   ])
  dispatch(getFarmInfoSuccess(
    L1LPInfo.poolInfo,
    L1LPInfo.userInfo,
    L2LPInfo.poolInfo,
    L2LPInfo.userInfo,
  ))
}

// export const getL1Fee = () => async (dispatch) => {
//   dispatch(getL1FeeBegin())
//   const [totalFeeRate, userFeeRate] = await Promise.all([
//     networkService.getL1TotalFeeRate(),
//     networkService.getL1UserRewardFeeRate(),
//   ])
//   console.log("L1 totalFeeRate",totalFeeRate)
//   console.log("L1 userRewardFeeRate",userFeeRate)
//   dispatch(getL1FeeSuccess(totalFeeRate, userFeeRate))
// }

// export const getL2Fee = () => async (dispatch) => {
//   dispatch(getL2FeeBegin())
//   const [totalFeeRate, userFeeRate] = await Promise.all([
//     networkService.getL2TotalFeeRate(),
//     networkService.getL2UserRewardFeeRate(),
//   ])
//   console.log("L2 totalFeeRate",totalFeeRate)
//   console.log("L2 userRewardFeeRate",userFeeRate)
//   dispatch(getL2FeeSuccess(totalFeeRate, userFeeRate))
// }

export const updateStakeToken = (stakeToken) => ({
  type: 'UPDATE_STAKE_TOKEN',
  payload: stakeToken,
})

export const updateWithdrawToken = (withdrawToken) => ({
  type: 'UPDATE_WITHDRAW_TOKEN',
  payload: withdrawToken,
})

export function fetchAllowance(currency, lpAddress) {
  return createAction('FETCH/ALLOWANCE', () => networkService.checkAllowance(
    currency,
    lpAddress
  ))
}

export function addLiquidity(
  currency,
  weiString,
  L1orL2Pool
) {
  return createAction('ADD/LIQUIDITY', () => networkService.addLiquidity(
    currency,
    weiString,
    L1orL2Pool
  ))
}

export function fetchL1LPBalance(currency) {
  return createAction('FETCH/L1LPBALANCE', () => networkService.L1LPBalance(currency))
}

export function fetchL2LPBalance(currency) {
  return createAction('FETCH/L2LPBALANCE', () => networkService.L2LPBalance(currency))
}