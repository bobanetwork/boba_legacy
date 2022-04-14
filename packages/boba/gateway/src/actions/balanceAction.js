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

export function fetchL1LPBalance(address) {
    return createAction('FETCH/L1LP/BALANCE', () => networkService.L1LPBalance(address))
}

export function fetchL2LPBalance(address) {
    return createAction('FETCH/L2LP/BALANCE', () => networkService.L2LPBalance(address))
}

export function fetchL1LPPending(address) {
    return createAction('FETCH/L1LP/PENDING', () => networkService.L1LPPending(address))
}

export function fetchL2LPPending(address) {
    return createAction('FETCH/L2LP/PENDING', () => networkService.L2LPPending(address))
}

export function fetchL1LPLiquidity(address) {
    return createAction('FETCH/L1LP/LIQUIDITY', () => networkService.L1LPLiquidity(address))
}

export function fetchL2LPLiquidity(address) {
    return createAction('FETCH/L2LP/LIQUIDITY', () => networkService.L2LPLiquidity(address))
}

export function fetchL1TotalFeeRate() { return createAction('FETCH/L1TOTALFEERATE', ()=>{return networkService.getL1TotalFeeRate()}) }
export function fetchL2TotalFeeRate() { return createAction('FETCH/L2TOTALFEERATE', ()=>{return networkService.getL2TotalFeeRate()}) }

export function fetchL1FeeRateN(tokenAddress) { return createAction('FETCH/L1FEERATE', ()=>{return networkService.getL1UserRewardFeeRate(tokenAddress)}) }
export function fetchL2FeeRateN(tokenAddress) { return createAction('FETCH/L2FEERATE', ()=>{return networkService.getL2UserRewardFeeRate(tokenAddress)}) }

export function fetchFastExitCost(address) {
    return createAction('FETCH/FASTEXIT/COST', () => networkService.getFastExitCost(address))
}

export function fetchClassicExitCost(address) {
    return createAction('FETCH/CLASSICEXIT/COST', () => networkService.getExitCost(address))
}

export function fetchFastDepositCost(address) {
    return createAction('FETCH/FASTDEPOSIT/COST', () => networkService.getFastDepositCost(address))
}

export function fetchFastDepositBatchCost(tokenList) {
  return createAction('FETCH/FASTDEPOSIT/BATCH/COST', () => networkService.getFastDepositBatchCost(tokenList))
}

export function fetchL1FeeBalance() {
    return createAction('FETCH/L1FEE/BALANCE', () => networkService.getL1FeeBalance())
}

export function fetchL2BalanceETH() {
    return createAction('FETCH/L2ETH/BALANCE', () => networkService.getL2BalanceETH())
}

export function fetchL2BalanceBOBA() {
    return createAction('FETCH/L2BOBA/BALANCE', () => networkService.getL2BalanceBOBA())
}

export function fetchUserAndL2LPBalanceBatch(tokenList) {
    return createAction('FETCH/USER/L2LP/BALANCE/BATCH', () => networkService.getL2UserAndLPBalanceBatch(tokenList))
}

export function fetchExitFee() {
  return createAction('FETCH/EXITFEE', () => networkService.getExitFeeFromBillingContract())
}
