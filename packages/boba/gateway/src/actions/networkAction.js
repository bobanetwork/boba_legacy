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

import gasService from 'services/gas.service'
import networkService from 'services/networkService'
import transactionService from 'services/transaction.service'
import { createAction } from './createAction'

export function fetchBalances() {
  return createAction('BALANCE/GET', () => networkService.getBalances())
}

export function fetchGas() {
  return createAction('GAS/GET', () => gasService.getGas())
}

export function addTokenList() {
  return createAction('TOKENLIST/GET', () => networkService.addTokenList())
}

export function fetchTransactions() {
  return createAction('TRANSACTION/GETALL', () =>
    transactionService.getTransactions()
  )
}

export function fetchSevens() {
  return createAction('SEVENS/GETALL', () =>
    transactionService.getSevens()
  )
}

export function fetchFastExits() {
  return createAction('FASTEXITS/GETALL', () =>
    transactionService.getFastExits()
  )
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

export function isTeleportationOfAssetSupported(layer, asset, destChainId) {
  return createAction('DEPOSIT/TELEPORTATION/TOKEN_SUPPORTED', () =>
    networkService.isTeleportationOfAssetSupported(layer, asset, destChainId)
  )
}

export function depositWithTeleporter(layer, currency, value, destChainId) {
  return createAction('DEPOSIT/CREATE', () =>
      networkService.depositWithTeleporter(layer, currency, value, destChainId)
  )
}

export function depositL1LPBatch(payload) {
  return createAction('DEPOSIT/CREATE', () =>
    networkService.depositL1LPBatch(payload)
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

//CLASSIC DEPOSIT ETH
export function depositETHL2(payload) {
  return createAction('DEPOSIT/CREATE', () => {
    return networkService.depositETHL2(payload)
  }
  )
}

//DEPOSIT ERC20
export function depositErc20(payload) {
  return createAction('DEPOSIT/CREATE', () =>
    networkService.depositErc20(payload)
  )
}

//DEPOSIT ERC20 to Alt L1 bridge
export function depositErc20ToL1(payload) {
  return createAction('DEPOSIT_ALTL1/CREATE', () => networkService.depositErc20ToL1(payload))
}

//EARN
export function earnL1(value_Wei_String, currencyAddress) {
  return createAction('EARN/CREATE', () =>
    networkService.approveERC20_L1LP(value_Wei_String, currencyAddress)
  )
}
export function earnL2(value_Wei_String, currencyAddress) {
  return createAction('EARN/CREATE', () =>
    networkService.approveERC20_L2LP(value_Wei_String, currencyAddress)
  )
}
export function getReward(currencyAddress, value_Wei_String, L1orL2Pool) {
  return createAction('EARN/HARVEST', () =>
    networkService.getReward(currencyAddress, value_Wei_String, L1orL2Pool)
  )
}

export function withdrawLiquidity(currencyAddress, value_Wei_String, L1orL2Pool) {

  return createAction('EARN/WITHDRAW', () =>
    networkService.withdrawLiquidity(currencyAddress, value_Wei_String, L1orL2Pool)
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

export function approveFastDepositBatch(payload) {
  return createAction('APPROVE/CREATE', () =>
    networkService.approveFastDepositBatch(
      payload
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

export function transferEstimate(value_Wei_String, currency) {
  return createAction('TRANSFER_ESTIMATE/CREATE', () =>
    networkService.transferEstimate(value_Wei_String, currency)
  )
}

export function transferNFT(recipient, nft) {
  return createAction('TRANSFER_NFT/CREATE', () =>
    networkService.transferNFT(recipient, nft)
  )
}

export function settle_v0() {
  return createAction('SETTLE_v0/CREATE', () =>
    networkService.settle_v0()
  )
}

export function settle_v1() {
  return createAction('SETTLE_v1/CREATE', () =>
    networkService.settle_v1()
  )
}

export function settle_v2() {
  return createAction('SETTLE_v2/CREATE', () =>
    networkService.settle_v2()
  )
}

export function settle_v2OLO() {
  return createAction('SETTLE_v2OLO/CREATE', () =>
    networkService.settle_v2OLO()
  )
}

export function settle_v3() {
  return createAction('SETTLE_v3/CREATE', () =>
    networkService.settle_v3()
  )
}

export function settle_v3OLO() {
  return createAction('SETTLE_v3OLO/CREATE', () =>
    networkService.settle_v3OLO()
  )
}

export function fetchLookUpPrice(params) {
  return createAction('PRICE/GET', () =>
    networkService.fetchLookUpPrice(params))
}

export function clearLookupPrice() {
  return function (dispatch) {
    return dispatch({ type: 'LOOKUP/PRICE/CLEAR' })
  }
}

export function enableBrowserWallet(network) {
  return createAction('ENABLE/BROWSER/WALLET', () => networkService.enableBrowserWallet(network))
}

export function getAllAddresses() {
  return createAction('GET/ALL/ADDRESS', () => networkService.getAllAddresses())
}


/********************************/
/******ONE GATEWAY ACTIONS *****/
/********************************/
/**
 * @params
 *  network - ethereum, bnb, avax
 *  networkType -  MAINNET, TESTNET
*/
export function setNetwork(payload) {
  return function (dispatch) {
    return dispatch({ type: 'NETWORK/SET', payload: payload })
  }
}

// to update the active network.
export function setActiveNetwork(payload) {
  return function (dispatch) {
    return dispatch({ type: 'NETWORK/SET/ACTIVE' })
  }
}

export function setActiveNetworkType(payload) {
  return function (dispatch) {
    return dispatch({ type: 'NETWORK/SET_TYPE/ACTIVE', payload })
  }
}

export function fetchBlockExplorerUrls() {
  return createAction('NETWORK/SET/BLOCK_EXPLORER', () => networkService.getBlockExplorerLinks())
}
