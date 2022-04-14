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

export function setEnableAccount(enabled) {
  console.log("setEnableAccount:", enabled)
  return function (dispatch) {
    return dispatch({ type: 'SETUP/ACCOUNT/SET', payload: enabled })
  }
}

export function setBaseState(enabled) {
  console.log("setBaseState:", enabled)
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

export function setAccountNumber(account) {
  return function (dispatch) {
    return dispatch({ type: 'SETUP/ACCOUNT_NUMBER/SET', payload: account })
  }
}

export function switchChain(layer) {
  console.log("SA: Switching chain to", layer)
  return createAction('SETUP/SWITCH', () => networkService.switchChain(layer))
}