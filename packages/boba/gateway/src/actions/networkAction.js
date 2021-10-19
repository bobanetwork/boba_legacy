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
import { createAction } from './createAction'

export function fetchBalances() {
  return createAction('BALANCE/GET', () => networkService.getBalances())
}

export function addTokenList() {
  console.log("addTokenList")
  return createAction('TOKENLIST/GET', () => networkService.addTokenList())
}

export function fetchNFTs() {
  console.log("fetchNFTs")
  return createAction('NFTS/GET', () => networkService.fetchNFTs())
}

export function fetchTransactions() {
  return createAction('TRANSACTION/GETALL', () =>
    networkService.getTransactions()
  )
}

export function fetchExits() {
  return createAction('EXIT/GETALL', () => networkService.getExits())
}

export function exitBOBA(token, value) {
  return createAction('EXIT/CREATE', () =>
    networkService.exitBOBA(token, value)
  )
}

//SWAP RELATED
export function depositL1LP(currency, value, decimals) {
  return createAction('DEPOSIT/CREATE', () =>
    networkService.depositL1LP(currency, value, decimals)
  )
}

//SWAP RELATED - Depositing into the L2LP triggers the swap-exit
export function depositL2LP(token, value) {
  return createAction('EXIT/CREATE', () =>
    networkService.depositL2LP(token, value)
  )
}

//SWAP RELATED - Depositing into the L2LP triggers the swap-exit - variant of depositL2LP
//that handles Exit All 
export function fastExitAll(token) {
  return createAction('EXIT/CREATE', () =>
    networkService.fastExitAll(token)
  )
}

//CLASSICAL DEPOSIT ETH
export function depositETHL2(value) {
  return createAction('DEPOSIT/CREATE', () => {
      return networkService.depositETHL2(value)
    }
  )
}

//DEPOSIT ERC20
export function depositErc20(value, currency, currencyL2) {
  console.log("Depositing ERC20")
  return createAction('DEPOSIT/CREATE', () =>
    networkService.depositErc20(value, currency, currencyL2)
  )
}

//FARM
export function farmL1(value_Wei_String, currencyAddress) {
  return createAction('FARM/CREATE', () =>
    networkService.approveERC20_L1LP(value_Wei_String, currencyAddress)
  )
}
export function farmL2(value_Wei_String, currencyAddress) {
  return createAction('FARM/CREATE', () =>
    networkService.approveERC20_L2LP(value_Wei_String, currencyAddress)
  )
}
export function getRewardL1(currencyL1Address, value_Wei_String) {
  return createAction('FARM/HARVEST', () =>
    networkService.getRewardL1(currencyL1Address, value_Wei_String)
  )
}
export function getRewardL2(currencyL2Address, value_Wei_String) {
  return createAction('FARM/HARVEST', () =>
    networkService.getRewardL2(currencyL2Address, value_Wei_String)
  )
}
export function withdrawLiquidity(currency, value_Wei_String, L1orL2Pool) {
  return createAction('FARM/WITHDRAW', () =>
    networkService.withdrawLiquidity(currency, value_Wei_String, L1orL2Pool)
  )
}

export function approveERC20(
  value,
  currency,
  approveContractAddress,
  contractABI
) {
  return createAction('APPROVE/CREATE', () =>
    networkService.approveERC20(
      value,
      currency,
      approveContractAddress,
      contractABI
    )
  )
}

export function approveERC20_L2LP(
  value,
  currency,
) {
  return createAction('APPROVE/CREATE', () =>
    networkService.approveERC20_L2LP(
      value,
      currency,
    )
  )
}

export function approveERC20_L1LP(
  value,
  currency,
) {
  return createAction('APPROVE/CREATE', () =>
    networkService.approveERC20_L1LP(
      value,
      currency,
    )
  )
}

export function transfer(recipient, value, currency) {
  return createAction('TRANSFER/CREATE', () =>
    networkService.transfer(recipient, value, currency)
  )
}

export function fetchLookUpPrice(params) {
  return createAction('PRICE/GET', () =>
    networkService.fetchLookUpPrice(params))
}
