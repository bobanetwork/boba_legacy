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

import store from "store";

export function setToken(token) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/TOKEN/SELECT', payload: token });
  }
}

export function resetToken() {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/TOKEN/RESET' });
  }
}

export function removeToken(tokenIndex) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/TOKEN/REMOVE', payload: tokenIndex });
  }
}

export function setTokenAmount(payload) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/TOKEN/AMOUNT/CHANGE', payload });
  }
}

export function updateToken(payload) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/TOKEN/UPDATE', payload });
  }
}

export function setBridgeType(type) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/TYPE/SELECT', payload: type });
  }
}

export function setMultiBridgeMode(mode) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/MODE/CHANGE', payload: mode });
  }
}

export function setBridgeToAddress(payload) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/TOADDRESS/SET', payload });
  }
}

export function setBridgeAlert(payload) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/ALERT/SET', payload });
  }
}

export function clearBridgeAlert(payload) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/ALERT/CLEAR', payload });
  }
}

export function purgeBridgeAlert(payload) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/ALERT/PURGE', payload });
  }
}

export function setAmountToBridge(payload) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/AMOUNT/SET', payload });
  }
}

export function resetBridgeAmount() {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/AMOUNT/RESET'});
  }
}

export function setTeleportationOfAssetSupported(payload) {
  return function (dispatch) {
    return dispatch({ type: 'BRIDGE/TELEPORTER/TOKEN_SUPPORTED', payload})
  }
}

export function setFetchDepositTxBlock(payload) {
  store.dispatch({ type: 'BRIDGE/DEPOSIT_TX/BLOCK', payload})
}
