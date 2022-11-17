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


import networkService from 'services/networkService'
import { createAction } from './createAction'
import store from 'store'

export function setEnableAccount(enabled) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/ACCOUNT/SET', payload: enabled })
  }
}

export function setBaseState(enabled) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/BASE/SET', payload: enabled })
  }
}

export function setNetwork(network) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/NETWORK/SET', payload: network })
  }
}

export function setLayer(layer) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/LAYER/SET', payload: layer })
  }
}

export function setWalletAddress(account) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/WALLETADDRESS/SET', payload: account })
  }
}

export function switchChain(layer) {
  return createAction('SETUP/SWITCH', () => networkService.switchChain(layer))
}

export function switchFee(targetFee) {
  return createAction('SETUP/SWITCHFEE', () => networkService.switchFee(targetFee))
}

export function getETHMetaTransaction() {
  return createAction('SETUP/GETETH', () => networkService.getETHMetaTransaction())
}

export async function addBobaFee ( bobaFee ) {
  store.dispatch({ type: 'BOBAFEE/ADD/SUCCESS', payload: bobaFee })
}

export function setConnectETH( state ) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/CONNECT_ETH', payload: state })
  }
}

export function setConnectBOBA( state ) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/CONNECT_BOBA', payload: state })
  }
}

export function setConnect( state ) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/CONNECT', payload: state })
  }
}
