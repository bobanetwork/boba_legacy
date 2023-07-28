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

export function selectBridgeTokens() {
  return function (state) {
    return state.bridge.tokens
  }
}

export function selectTokenToBridge() {
  return function (state) {
    return state.bridge.tokens[ 0 ]
  }
}

export function selectBridgeType() {
  return function (state) {
    return state.bridge.bridgeType
  }
}

export function selectMultiBridgeMode() {
  return function (state) {
    return state.bridge.multiBridgeMode
  }
}

export function selectBridgeToAddressState() {
  return function (state) {
    return state.bridge.bridgeToAddressState
  }
}

export function selectAmountToBridge() {
  return function (state) {
    return state.bridge.amountToBridge
  }
}

export function selectBridgeAlerts() {
  return function (state) {
    return state.bridge.alerts
  }
}

export function selectIsFetchTxBlockNumber() {
  return function (state) {
    return state.bridge.isFetchTxBlockNumber
  }
}

