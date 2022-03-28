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
