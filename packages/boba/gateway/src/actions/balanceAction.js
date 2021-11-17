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

import networkService from 'services/networkService';
import { createAction } from './createAction';

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

export function fetchL1TotalFeeRate() {
    return createAction('FETCH/L1TOTALFEERATE', () => networkService.getL1TotalFeeRate())
}

export function fetchL2TotalFeeRate() {
    return createAction('FETCH/L2TOTALFEERATE', () => networkService.getL2TotalFeeRate())
}

export function fetchFastExitCost(address) {
    return createAction('FETCH/FASTEXIT/COST', () => networkService.getFastExitCost(address))
}

export function fetchFastDepositCost(address) {
    return createAction('FETCH/FASTDEPOSIT/COST', () => networkService.getFastDepositCost(address))
}

export function fetchL1FeeBalance() {
    return createAction('FETCH/L1FEE/BALANCE', () => networkService.getL1FeeBalance())
}

export function fetchL2FeeBalance() {
    return createAction('FETCH/L2FEE/BALANCE', () => networkService.getL2FeeBalance())
}