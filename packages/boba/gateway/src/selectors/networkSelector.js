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

export function selectNetwork () {
  return function (state) {
    return state.network['network']
  }
}

export function selectNetworkType() {
  return function (state) {
    return state.network['networkType']
  }
}

export function selectActiveNetwork () {
  return function (state) {
    return state.network['activeNetwork']
  }
}

export function selectActiveNetworkType() {
  return function (state) {
    return state.network['activeNetworkType']
  }
}

export function selectActiveNetworkIcon() {
  return function (state) {
    return state.network['activeNetworkIcon']
  }
}
export function selectActiveNetworkName() {
  return function (state) {
    return state.network['activeNetworkName']
  }
}

export function selectBlockExplorerLinks() {
  return function (state) {
    return state.network['blockExplorerLinks']
  }
}